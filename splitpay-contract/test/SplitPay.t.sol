// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {SplitPay} from "src/SplitPay.sol";

/// @title SplitPay Test Suite
/// @notice Comprehensive tests covering happy paths, edge cases, access control, and math precision.
contract SplitPayTest is Test {
    SplitPay public splitPay;

    address public owner;
    address public alice;
    address public bob;
    address public charlie;
    address public treasury;

    uint256 public constant DEFAULT_FEE_BPS = 200; // 2%
    uint256 public constant BPS = 10_000;

    // ──────────────────────────────────────────────
    //  Events (re-declared for expectEmit)
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
    //  Setup
    // ──────────────────────────────────────────────

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        treasury = makeAddr("treasury");

        vm.prank(owner);
        splitPay = new SplitPay(DEFAULT_FEE_BPS);

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    function _twoWaySplit() internal pure returns (address[] memory recipients, uint256[] memory shares) {
        recipients = new address[](2);
        shares = new uint256[](2);
        // Placeholders — callers override
        return (recipients, shares);
    }

    function _threeWaySplit()
        internal
        view
        returns (address[] memory recipients, uint256[] memory shares)
    {
        recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = charlie;

        shares = new uint256[](3);
        shares[0] = 5000; // 50%
        shares[1] = 3000; // 30%
        shares[2] = 2000; // 20%

        return (recipients, shares);
    }

    // ═════════════════════════════════════════════
    //  1. CONSTRUCTOR
    // ═════════════════════════════════════════════

    function test_Constructor_SetsOwner() public view {
        assertEq(splitPay.owner(), owner);
    }

    function test_Constructor_SetsFee() public view {
        assertEq(splitPay.platformFeeBps(), DEFAULT_FEE_BPS);
    }

    function test_Constructor_ZeroFee() public {
        SplitPay zeroFee = new SplitPay(0);
        assertEq(zeroFee.platformFeeBps(), 0);
    }

    function test_Constructor_MaxFee() public {
        SplitPay maxFee = new SplitPay(1000);
        assertEq(maxFee.platformFeeBps(), 1000);
    }

    function test_Constructor_RevertsOnExcessiveFee() public {
        vm.expectRevert(abi.encodeWithSelector(SplitPay.FeeTooHigh.selector, 1001));
        new SplitPay(1001);
    }

    // ═════════════════════════════════════════════
    //  2. SPLIT PAYMENT — Happy Paths
    // ═════════════════════════════════════════════

    function test_SplitPayment_TwoRecipients_EqualSplit() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        uint256 sendAmount = 10 ether;
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS; // 0.2 ether
        uint256 netAmount = sendAmount - expectedFee; // 9.8 ether
        uint256 expectedEach = netAmount / 2; // 4.9 ether

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;

        vm.prank(bob);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        // Alice is not the sender, straightforward check
        assertEq(alice.balance, aliceBefore + expectedEach, "Alice payout incorrect");
        // Bob is the sender: final = before - sent + received
        assertEq(bob.balance, bobBefore - sendAmount + expectedEach, "Bob payout incorrect");
        assertEq(splitPay.accumulatedFees(), expectedFee, "Fee accumulation incorrect");
        assertEq(splitPay.splitCount(), 1, "Split count should be 1");
    }

    function test_SplitPayment_ThreeRecipients_UnequalSplit() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        uint256 sendAmount = 1 ether;
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS; // 0.02 ether
        uint256 netAmount = sendAmount - expectedFee; // 0.98 ether

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;
        uint256 charlieBefore = charlie.balance;

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        uint256 alicePayout = (netAmount * 5000) / BPS;
        uint256 bobPayout = (netAmount * 3000) / BPS;
        uint256 charliePayout = netAmount - alicePayout - bobPayout; // dust goes to last

        assertEq(alice.balance, aliceBefore - sendAmount + alicePayout, "Alice balance incorrect");
        assertEq(bob.balance - bobBefore, bobPayout, "Bob payout incorrect");
        assertEq(charlie.balance - charlieBefore, charliePayout, "Charlie payout incorrect");
    }

    function test_SplitPayment_SingleRecipient() public {
        address[] memory recipients = new address[](1);
        recipients[0] = bob;

        uint256[] memory shares = new uint256[](1);
        shares[0] = BPS; // 100%

        uint256 sendAmount = 5 ether;
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS;
        uint256 netAmount = sendAmount - expectedFee;

        uint256 bobBefore = bob.balance;

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        assertEq(bob.balance - bobBefore, netAmount, "Single recipient should get full net amount");
        assertEq(splitPay.accumulatedFees(), expectedFee);
    }

    function test_SplitPayment_EmitsEvent() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        uint256 sendAmount = 1 ether;
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS;

        vm.expectEmit(true, true, false, true);
        emit PaymentSplit(alice, 0, sendAmount, expectedFee, 3);

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);
    }

    function test_SplitPayment_IncrementsSplitCount() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
        assertEq(splitPay.splitCount(), 1);

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
        assertEq(splitPay.splitCount(), 2);

        vm.prank(bob);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
        assertEq(splitPay.splitCount(), 3);
    }

    // ═════════════════════════════════════════════
    //  3. MATH PRECISION — Dust & Rounding
    // ═════════════════════════════════════════════

    function test_SplitPayment_NoDustLeftInContract() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        uint256 sendAmount = 1 ether;

        uint256 contractBefore = address(splitPay).balance;

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        // Contract should only hold the accumulated fee, nothing more
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS;
        assertEq(
            address(splitPay).balance - contractBefore,
            expectedFee,
            "Contract should only hold platform fee, no dust"
        );
    }

    function test_SplitPayment_OddAmount_NoDust() public {
        // Intentionally tricky amount that causes rounding
        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = charlie;

        uint256[] memory shares = new uint256[](3);
        shares[0] = 3333;
        shares[1] = 3333;
        shares[2] = 3334; // sums to 10_000

        uint256 sendAmount = 1 ether + 1; // odd wei amount

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS;
        assertEq(
            address(splitPay).balance,
            expectedFee,
            "No dust should remain after odd-amount split"
        );
    }

    function test_SplitPayment_SmallAmount_WeiPrecision() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        uint256 sendAmount = 101; // 101 wei

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS; // = 2 wei
        uint256 netAmount = sendAmount - expectedFee; // = 99 wei
        uint256 aliceExpected = (netAmount * 5000) / BPS; // = 49 wei
        uint256 bobExpected = netAmount - aliceExpected; // = 50 wei (dust to last)

        // Alice is sender AND recipient: final = before - sent + received
        assertEq(alice.balance, aliceBefore - sendAmount + aliceExpected, "Alice wei precision");
        assertEq(bob.balance, bobBefore + bobExpected, "Bob gets dust");
        assertEq(address(splitPay).balance, expectedFee, "Contract holds only fee");
    }

    function test_SplitPayment_ZeroFee_NoFeeTaken() public {
        SplitPay zeroFee = new SplitPay(0);

        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        uint256 sendAmount = 1 ether;
        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;

        vm.prank(alice);
        zeroFee.splitPayment{value: sendAmount}(recipients, shares);

        assertEq(zeroFee.accumulatedFees(), 0, "No fees should accumulate with 0% fee");
        assertEq(address(zeroFee).balance, 0, "Contract should hold nothing with 0% fee");
        // Alice: sender AND recipient. Bob: recipient only.
        // Total distributed = (alice.balance - aliceBefore + sendAmount) + (bob.balance - bobBefore)
        // Rewrite to avoid underflow:
        uint256 aliceReceived = alice.balance + sendAmount - aliceBefore;
        uint256 bobReceived = bob.balance - bobBefore;
        assertEq(aliceReceived + bobReceived, sendAmount, "All funds distributed");
    }

    // ═════════════════════════════════════════════
    //  4. REVERT CONDITIONS
    // ═════════════════════════════════════════════

    function test_Revert_ZeroPayment() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.expectRevert(SplitPay.ZeroPayment.selector);
        vm.prank(alice);
        splitPay.splitPayment{value: 0}(recipients, shares);
    }

    function test_Revert_EmptyRecipients() public {
        address[] memory recipients = new address[](0);
        uint256[] memory shares = new uint256[](0);

        vm.expectRevert(SplitPay.EmptyRecipients.selector);
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_TooManyRecipients() public {
        uint256 count = 21;
        address[] memory recipients = new address[](count);
        uint256[] memory shares = new uint256[](count);

        for (uint256 i; i < count; ++i) {
            recipients[i] = makeAddr(string(abi.encodePacked("r", i)));
            shares[i] = (i < count - 1) ? (BPS / count) : BPS - (BPS * (count - 1)) / count;
        }

        vm.expectRevert(abi.encodeWithSelector(SplitPay.TooManyRecipients.selector, count));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_ArrayLengthMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](3);
        shares[0] = 3000;
        shares[1] = 3000;
        shares[2] = 4000;

        vm.expectRevert(abi.encodeWithSelector(SplitPay.ArrayLengthMismatch.selector, 2, 3));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_SharesSumNot10000() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 4999; // sums to 9999

        vm.expectRevert(abi.encodeWithSelector(SplitPay.SharesSumInvalid.selector, 9999));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_SharesSumOver10000() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5001; // sums to 10001

        vm.expectRevert(abi.encodeWithSelector(SplitPay.SharesSumInvalid.selector, 10001));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_ZeroAddressRecipient() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = address(0);

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        vm.expectRevert(abi.encodeWithSelector(SplitPay.ZeroAddressRecipient.selector, 1));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    function test_Revert_ZeroShare() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = BPS;
        shares[1] = 0;

        vm.expectRevert(abi.encodeWithSelector(SplitPay.ZeroShare.selector, 1));
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
    }

    // ═════════════════════════════════════════════
    //  5. MAX RECIPIENTS (20)
    // ═════════════════════════════════════════════

    function test_SplitPayment_MaxRecipients() public {
        uint256 count = 20;
        address[] memory recipients = new address[](count);
        uint256[] memory shares = new uint256[](count);

        uint256 shareEach = BPS / count; // 500 each
        for (uint256 i; i < count; ++i) {
            recipients[i] = makeAddr(string(abi.encodePacked("rec", i)));
            shares[i] = shareEach;
        }
        // Fix rounding: last recipient gets remainder
        shares[count - 1] = BPS - shareEach * (count - 1);

        uint256 sendAmount = 10 ether;
        uint256 expectedFee = (sendAmount * DEFAULT_FEE_BPS) / BPS;

        vm.prank(alice);
        splitPay.splitPayment{value: sendAmount}(recipients, shares);

        // Verify total distributed + fee = sendAmount
        uint256 totalDistributed;
        for (uint256 i; i < count; ++i) {
            totalDistributed += recipients[i].balance;
        }
        assertEq(totalDistributed + expectedFee, sendAmount, "Total distributed + fee must equal send amount");
        assertEq(address(splitPay).balance, expectedFee, "Contract holds only fee");
    }

    // ═════════════════════════════════════════════
    //  6. FEE WITHDRAWAL
    // ═════════════════════════════════════════════

    function test_WithdrawFees_Success() public {
        // First, accumulate some fees
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 10 ether}(recipients, shares);

        uint256 expectedFee = (10 ether * DEFAULT_FEE_BPS) / BPS; // 0.2 ether
        assertEq(splitPay.accumulatedFees(), expectedFee);

        uint256 treasuryBefore = treasury.balance;

        vm.expectEmit(true, false, false, true);
        emit FeeWithdrawn(treasury, expectedFee);

        vm.prank(owner);
        splitPay.withdrawFees(treasury);

        assertEq(treasury.balance - treasuryBefore, expectedFee, "Treasury should receive fees");
        assertEq(splitPay.accumulatedFees(), 0, "Accumulated fees should be zero");
        assertEq(address(splitPay).balance, 0, "Contract should be empty after fee withdrawal");
    }

    function test_WithdrawFees_AccumulatesFromMultipleSplits() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);

        vm.prank(bob);
        splitPay.splitPayment{value: 2 ether}(recipients, shares);

        vm.prank(alice);
        splitPay.splitPayment{value: 3 ether}(recipients, shares);

        uint256 totalSent = 6 ether;
        uint256 expectedTotalFee = (totalSent * DEFAULT_FEE_BPS) / BPS;
        assertEq(splitPay.accumulatedFees(), expectedTotalFee, "Fees should accumulate across splits");
    }

    function test_Revert_WithdrawFees_NotOwner() public {
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);

        vm.expectRevert();
        vm.prank(alice); // not owner
        splitPay.withdrawFees(alice);
    }

    function test_Revert_WithdrawFees_NoFees() public {
        vm.expectRevert(SplitPay.NoFeesToWithdraw.selector);
        vm.prank(owner);
        splitPay.withdrawFees(treasury);
    }

    function test_Revert_WithdrawFees_ZeroAddress() public {
        // Accumulate fees first
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();
        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);

        vm.expectRevert(abi.encodeWithSelector(SplitPay.ZeroAddressRecipient.selector, 0));
        vm.prank(owner);
        splitPay.withdrawFees(address(0));
    }

    // ═════════════════════════════════════════════
    //  7. SET FEE BPS
    // ═════════════════════════════════════════════

    function test_SetFeeBps_Success() public {
        vm.expectEmit(false, false, false, true);
        emit FeeBpsUpdated(DEFAULT_FEE_BPS, 500);

        vm.prank(owner);
        splitPay.setFeeBps(500);

        assertEq(splitPay.platformFeeBps(), 500);
    }

    function test_SetFeeBps_ToZero() public {
        vm.prank(owner);
        splitPay.setFeeBps(0);
        assertEq(splitPay.platformFeeBps(), 0);
    }

    function test_SetFeeBps_ToMax() public {
        vm.prank(owner);
        splitPay.setFeeBps(1000); // 10%
        assertEq(splitPay.platformFeeBps(), 1000);
    }

    function test_Revert_SetFeeBps_ExceedsMax() public {
        vm.expectRevert(abi.encodeWithSelector(SplitPay.FeeTooHigh.selector, 1001));
        vm.prank(owner);
        splitPay.setFeeBps(1001);
    }

    function test_Revert_SetFeeBps_NotOwner() public {
        vm.expectRevert();
        vm.prank(alice);
        splitPay.setFeeBps(500);
    }

    function test_SetFeeBps_AffectsSubsequentSplits() public {
        // Split with 2% fee
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);
        uint256 feeAfterFirst = splitPay.accumulatedFees();
        assertEq(feeAfterFirst, (1 ether * 200) / BPS);

        // Change fee to 5%
        vm.prank(owner);
        splitPay.setFeeBps(500);

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);

        uint256 secondFee = (1 ether * 500) / BPS;
        assertEq(splitPay.accumulatedFees(), feeAfterFirst + secondFee, "New fee rate should apply");
    }

    // ═════════════════════════════════════════════
    //  8. VIEW FUNCTION
    // ═════════════════════════════════════════════

    function test_GetAccumulatedFees_ReturnsCorrectValue() public {
        assertEq(splitPay.getAccumulatedFees(), 0, "Initial fees should be 0");

        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 1 ether}(recipients, shares);

        assertEq(splitPay.getAccumulatedFees(), splitPay.accumulatedFees());
    }

    // ═════════════════════════════════════════════
    //  9. REENTRANCY PROTECTION
    // ═════════════════════════════════════════════

    function test_Reentrancy_SplitPaymentProtected() public {
        // Deploy a reentrancy attacker
        ReentrancyAttacker attacker = new ReentrancyAttacker(splitPay);
        vm.deal(address(attacker), 10 ether);

        address[] memory recipients = new address[](2);
        recipients[0] = address(attacker);
        recipients[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 5000;
        shares[1] = 5000;

        // The attacker tries to re-enter splitPayment during receive()
        // This should not allow double-spending
        vm.prank(address(attacker));
        attacker.attack{value: 1 ether}(recipients, shares);

        // If reentrancy succeeded, the contract would be drained.
        // With ReentrancyGuard, the reentrant call reverts but the outer call succeeds.
        // We verify no extra funds were extracted.
        uint256 expectedFee = (1 ether * DEFAULT_FEE_BPS) / BPS;
        assertEq(address(splitPay).balance, expectedFee, "Contract should only hold the fee");
    }

    // ═════════════════════════════════════════════
    //  10. INTEGRATION — Full Lifecycle
    // ═════════════════════════════════════════════

    function test_FullLifecycle() public {
        // 1. Deploy with 2% fee
        assertEq(splitPay.platformFeeBps(), 200);
        assertEq(splitPay.splitCount(), 0);
        assertEq(splitPay.accumulatedFees(), 0);

        // 2. First split: 10 ETH, 3 recipients (50/30/20)
        (address[] memory recipients, uint256[] memory shares) = _threeWaySplit();

        vm.prank(alice);
        splitPay.splitPayment{value: 10 ether}(recipients, shares);

        assertEq(splitPay.splitCount(), 1);
        uint256 fee1 = (10 ether * 200) / BPS; // 0.2 ETH
        assertEq(splitPay.accumulatedFees(), fee1);

        // 3. Second split: 5 ETH
        vm.prank(bob);
        splitPay.splitPayment{value: 5 ether}(recipients, shares);

        assertEq(splitPay.splitCount(), 2);
        uint256 fee2 = (5 ether * 200) / BPS; // 0.1 ETH
        assertEq(splitPay.accumulatedFees(), fee1 + fee2);

        // 4. Owner changes fee to 5%
        vm.prank(owner);
        splitPay.setFeeBps(500);

        // 5. Third split: 2 ETH with new fee
        vm.prank(alice);
        splitPay.splitPayment{value: 2 ether}(recipients, shares);

        uint256 fee3 = (2 ether * 500) / BPS; // 0.1 ETH
        assertEq(splitPay.accumulatedFees(), fee1 + fee2 + fee3);
        assertEq(splitPay.splitCount(), 3);

        // 6. Owner withdraws all fees
        uint256 totalFees = fee1 + fee2 + fee3;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(owner);
        splitPay.withdrawFees(treasury);

        assertEq(treasury.balance - treasuryBefore, totalFees);
        assertEq(splitPay.accumulatedFees(), 0);
        assertEq(address(splitPay).balance, 0);
    }
}

// ──────────────────────────────────────────────────
//  Reentrancy Attacker (Test Helper)
// ──────────────────────────────────────────────────

/// @dev Attempts to re-enter splitPayment when receiving native tokens.
contract ReentrancyAttacker {
    SplitPay public target;
    bool public attacked;

    constructor(SplitPay target_) {
        target = target_;
    }

    function attack(address[] calldata recipients, uint256[] calldata shares) external payable {
        target.splitPayment{value: msg.value}(recipients, shares);
    }

    receive() external payable {
        // Attempt reentrancy only once to avoid infinite loop
        if (!attacked) {
            attacked = true;
            address[] memory recipients = new address[](1);
            recipients[0] = address(this);
            uint256[] memory shares = new uint256[](1);
            shares[0] = 10_000;

            // This should revert due to ReentrancyGuard
            try target.splitPayment{value: 0}(recipients, shares) {} catch {}
        }
    }
}
