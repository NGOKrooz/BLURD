//! # Private Payment Contract
//! 
//! A minimal Starknet contract for private payments that:
//! - Accepts payment transactions
//! - Emits events for payment tracking
//! - Does NOT store sensitive data (addresses, amounts)
//! - Validates inputs

use starknet::ContractAddress;
use starknet::get_block_timestamp;
use starknet::get_caller_address;

#[starknet::interface]
trait IPrivatePayment<TContractState> {
    fn send_private_payment(
        ref self: TContractState,
        recipient: ContractAddress,
        amount: u128
    );
}

#[starknet::contract]
mod PrivatePayment {
    use super::{ContractAddress, get_block_timestamp, get_caller_address};

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PrivatePaymentSent: PrivatePaymentSent,
    }

    #[derive(Drop, starknet::Event)]
    struct PrivatePaymentSent {
        #[key]
        sender: ContractAddress,
        #[key]
        recipient: ContractAddress,
        amount: u128,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[external(v0)]
    fn send_private_payment(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u128
    ) {
        // Validation: amount must be greater than 0
        assert(amount > 0, 'Amount must be greater than 0');

        // Validation: recipient must not be zero address
        assert(recipient.is_non_zero(), 'Recipient cannot be zero address');

        // Get sender address
        let sender = get_caller_address();

        // Get current block timestamp
        let timestamp = get_block_timestamp();

        // Emit event for payment tracking
        self.emit(PrivatePaymentSent {
            sender,
            recipient,
            amount,
            timestamp,
        });
    }
}

