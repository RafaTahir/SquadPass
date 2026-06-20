use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use crate::state::Squad;
use crate::errors::SquadPassError;

#[derive(Accounts)]
#[instruction(squad_id: u64)]
pub struct CreateSquad<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        init,
        payer = organizer,
        space = 8 + Squad::INIT_SPACE,
        seeds = [b"squad", organizer.key().as_ref(), &squad_id.to_le_bytes()],
        bump
    )]
    pub squad: Account<'info, Squad>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = organizer,
        associated_token::mint = token_mint,
        associated_token::authority = squad,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateSquad>,
    squad_id: u64,
    country: String,
    name: String,
    subscription_amount: u64,
    cadence_seconds: i64,
) -> Result<()> {
    require!(country.len() <= 32, SquadPassError::CountryTooLong);
    require!(name.len() <= 64, SquadPassError::NameTooLong);
    require!(subscription_amount > 0, SquadPassError::InvalidAmount);
    require!(cadence_seconds > 0, SquadPassError::InvalidCadence);

    let clock = Clock::get()?;
    let squad = &mut ctx.accounts.squad;

    squad.squad_id = squad_id;
    squad.organizer = ctx.accounts.organizer.key();
    squad.country = country;
    squad.name = name;
    squad.subscription_amount = subscription_amount;
    squad.token_mint = ctx.accounts.token_mint.key();
    squad.cadence_seconds = cadence_seconds;
    squad.vault = ctx.accounts.vault.key();
    squad.is_active = true;
    squad.member_count = 0;
    squad.created_at = clock.unix_timestamp;
    squad.bump = ctx.bumps.squad;

    msg!("Squad created: {}", squad.squad_id);
    Ok(())
}
