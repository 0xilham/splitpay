#!/bin/bash
set -e

echo "[1/3] Building contract with Foundry..."
forge build

echo "[2/3] Extracting bytecode and appending constructor arguments..."
# Extract the bytecode block and strip leading 0x
BYTECODE=$(jq -r '.bytecode.object' out/SplitPay.sol/SplitPay.json | sed 's/^0x//')

# The constructor argument is initialFeeBps_ = 200 (which is 0xc8)
# ABI encode it using cast
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(uint256)" 200 | sed 's/^0x//')

printf "%s%s" "${BYTECODE}" "${CONSTRUCTOR_ARGS}" > splitpay.bin

echo "Generated splitpay.bin."

echo "[3/3] Deploying to Local Initia Appchain using minitiad..."
# Note: Assuming 'system-admin' or 'gas-station' is a funded local keyring account. 
# Update the --from key name to match your active funded weave account (e.g., 'Validator', 'system', 'bridge').
minitiad tx evm create splitpay.bin \
  --from Validator \
  --keyring-backend test \
  --gas auto --gas-adjustment 1.5 \
  --chain-id splitpay-rollup-1 \
  -y

echo "Deployment transaction broadcasted!"
echo "Run 'minitiad query tx <tx-hash>' a few seconds later to get the deployed EVM contract address."

rm splitpay.bin
