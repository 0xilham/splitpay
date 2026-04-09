// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SplitPay — Revenue-Generating Payment Splitter on Initia
/// @author SplitPay Team (INITIATE Hackathon)
/// @notice Splits native token payments across multiple recipients with a platform fee.
/// @dev Follows CEI (Checks-Effects-Interactions) pattern. All external calls are last.
contract SplitPay is Ownable, ReentrancyGuard {
    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% hard cap
    uint256 public constant MAX_RECIPIENTS = 20;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Platform fee in basis points (200 = 2%)
    uint256 public platformFeeBps;

    /// @notice Accumulated platform fees available for withdrawal
    uint256 public accumulatedFees;

    /// @notice Running counter for split IDs
    uint256 public splitCount;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PaymentSplit(
        address indexed sender,
        uint256 indexed splitId,
        uint256 totalAmount,
        uint256 feeAmount,
        uint256 recipientCount
    );

    event FeeWithdrawn(address indexed to, uint256 amount);

    event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    // ──────────────────────────────────────────────
    //  Custom Errors (gas-efficient)
    // ──────────────────────────────────────────────

    error ZeroPayment();
    error EmptyRecipients();
    error TooManyRecipients(uint256 count);
    error ArrayLengthMismatch(uint256 recipientsLength, uint256 sharesLength);
    error SharesSumInvalid(uint256 actualSum);
    error ZeroAddressRecipient(uint256 index);
    error ZeroShare(uint256 index);
    error FeeTooHigh(uint256 requestedBps);
    error NoFeesToWithdraw();
    error TransferFailed(address recipient, uint256 amount);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /// @param initialFeeBps_ Initial platform fee in basis points (e.g. 200 = 2%)
    constructor(uint256 initialFeeBps_) Ownable(msg.sender) {
        if (initialFeeBps_ > MAX_FEE_BPS) revert FeeTooHigh(initialFeeBps_);
        platformFeeBps = initialFeeBps_;
    }

    // ──────────────────────────────────────────────
    //  Core — splitPayment
    // ──────────────────────────────────────────────

    /// @notice Split a native token payment among multiple recipients.
    /// @param recipients Array of recipient addresses.
    /// @param shares Array of share values in basis points. Must sum to BPS_DENOMINATOR (10,000).
    /// @dev Follows CEI: validates → updates state → sends funds.
    ///      Any remaining dust from rounding is sent to the last recipient.
    function splitPayment(
        address[] calldata recipients,
        uint256[] calldata shares
    ) external payable nonReentrant {
        // ── CHECKS ──────────────────────────────
        if (msg.value == 0) revert ZeroPayment();
        if (recipients.length == 0) revert EmptyRecipients();
        if (recipients.length > MAX_RECIPIENTS) revert TooManyRecipients(recipients.length);
        if (recipients.length != shares.length) {
            revert ArrayLengthMismatch(recipients.length, shares.length);
        }

        uint256 sharesSum;
        for (uint256 i; i < shares.length; ++i) {
            if (recipients[i] == address(0)) revert ZeroAddressRecipient(i);
            if (shares[i] == 0) revert ZeroShare(i);
            sharesSum += shares[i];
        }
        if (sharesSum != BPS_DENOMINATOR) revert SharesSumInvalid(sharesSum);

        // ── EFFECTS ─────────────────────────────
        uint256 feeAmount = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 netAmount = msg.value - feeAmount;
        uint256 currentSplitId = splitCount;

        accumulatedFees += feeAmount;
        splitCount = currentSplitId + 1;

        emit PaymentSplit(msg.sender, currentSplitId, msg.value, feeAmount, recipients.length);

        // ── INTERACTIONS ────────────────────────
        // Track distributed amount to handle rounding dust
        uint256 distributed;
        uint256 lastIndex = recipients.length - 1;

        for (uint256 i; i < lastIndex; ++i) {
            uint256 payout = (netAmount * shares[i]) / BPS_DENOMINATOR;
            distributed += payout;
            _sendNative(recipients[i], payout);
        }

        // Last recipient gets the remainder to avoid dust
        uint256 lastPayout = netAmount - distributed;
        _sendNative(recipients[lastIndex], lastPayout);
    }

    // ──────────────────────────────────────────────
    //  Admin — Fee Management
    // ──────────────────────────────────────────────

    /// @notice Withdraw all accumulated platform fees to a specified address.
    /// @param to Address to receive the fees.
    function withdrawFees(address to) external onlyOwner nonReentrant {
        // CHECKS
        if (to == address(0)) revert ZeroAddressRecipient(0);
        uint256 amount = accumulatedFees;
        if (amount == 0) revert NoFeesToWithdraw();

        // EFFECTS
        accumulatedFees = 0;

        emit FeeWithdrawn(to, amount);

        // INTERACTIONS
        _sendNative(to, amount);
    }

    /// @notice Update the platform fee. Capped at MAX_FEE_BPS (10%).
    /// @param newFeeBps New fee in basis points.
    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh(newFeeBps);

        uint256 oldFeeBps = platformFeeBps;
        platformFeeBps = newFeeBps;

        emit FeeBpsUpdated(oldFeeBps, newFeeBps);
    }

    // ──────────────────────────────────────────────
    //  View
    // ──────────────────────────────────────────────

    /// @notice Returns the accumulated platform fees.
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /// @dev Send native tokens using low-level call. Reverts on failure.
    function _sendNative(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed(to, amount);
    }
}
