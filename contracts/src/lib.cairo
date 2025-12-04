use starknet::ContractAddress;

#[starknet::interface]
trait IPrivatePayment<TContractState> {
    fn send_private_payment(
        ref self: TContractState,
        recipient: ContractAddress,
        amount: u128,
        commitment: felt252
    );
    fn verify_commitment(self: @TContractState, commitment: felt252) -> bool;
}

#[starknet::contract]
mod PrivatePayment {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::Map;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        commitments: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PaymentSent: PaymentSent,
    }

    #[derive(Drop, starknet::Event)]
    struct PaymentSent {
        #[key]
        sender: ContractAddress,
        #[key]
        recipient: ContractAddress,
        amount: u128,
        commitment: felt252,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl PrivatePaymentImpl of super::IPrivatePayment<ContractState> {
        fn send_private_payment(
            ref self: ContractState,
            recipient: ContractAddress,
            amount: u128,
            commitment: felt252
        ) {
            // Validations
            assert(amount > 0, 'Amount must be > 0');
            assert(recipient.is_non_zero(), 'Invalid recipient');
            assert(commitment != 0, 'Invalid commitment');

            let sender = get_caller_address();
            
            // Store commitment for anti-replay protection
            self.commitments.write(commitment, true);

            // Get current timestamp
            let timestamp = get_block_timestamp();

            // Emit event for payment tracking
            self.emit(Event::PaymentSent(PaymentSent {
                sender,
                recipient,
                amount,
                commitment,
                timestamp,
            }));
        }

        fn verify_commitment(self: @ContractState, commitment: felt252) -> bool {
            self.commitments.read(commitment)
        }
    }
}
