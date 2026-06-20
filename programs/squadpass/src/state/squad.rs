use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Squad {
    pub squad_id: u64,
    pub organizer: Pubkey,
    #[max_len(32)]
    pub country: String,
    #[max_len(64)]
    pub name: String,
    pub subscription_amount: u64,
    pub token_mint: Pubkey,
    pub cadence_seconds: i64,
    pub vault: Pubkey,
    pub is_active: bool,
    pub member_count: u32,
    pub created_at: i64,
    pub bump: u8,
}
