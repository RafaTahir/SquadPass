use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum SubscriptionStatus {
    Active,
    Cancelled,
    Paused,
}

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub squad: Pubkey,
    pub next_due_at: i64,
    pub max_charge_amount: u64,
    pub billing_interval: i64,
    pub status: SubscriptionStatus,
    pub total_paid: u64,
    pub last_paid_at: i64,
    pub created_at: i64,
    pub bump: u8,
}
