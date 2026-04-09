// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {SplitPay} from "../src/SplitPay.sol";

contract Deploy is Script {
    uint256 public constant DEFAULT_FEE_BPS = 200; // 2%

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying SplitPay...");
        console.log("Deployer:", deployer);
        console.log("Platform Fee:", DEFAULT_FEE_BPS, "bps");

        vm.startBroadcast(deployerPrivateKey);

        SplitPay splitPay = new SplitPay(DEFAULT_FEE_BPS);

        console.log("SplitPay deployed at:", address(splitPay));

        vm.stopBroadcast();
    }
}
