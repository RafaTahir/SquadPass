use anchor_lang::prelude::*;

#[error_code]
pub enum SquadPassError {
    #[msg("Squad is not active")]
    SquadNotActive,
    #[msg("Subscription is not active")]
    SubscriptionNotActive,
    #[msg("Payment not yet due")]
    PaymentNotDue,
    #[msg("Prediction window closed")]
    PredictionWindowClosed,
    #[msg("Match result not final")]
    ResultNotFinal,
    #[msg("Prediction already settled")]
    AlreadySettled,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient delegate allowance")]
    InsufficientAllowance,
    #[msg("Country name too long (max 32 characters)")]
    CountryTooLong,
    #[msg("Squad name too long (max 64 characters)")]
    NameTooLong,
    #[msg("Invalid prediction type")]
    InvalidPredictionType,
    #[msg("Subscription already cancelled")]
    AlreadyCancelled,
    #[msg("Subscription amount must be greater than 0")]
    InvalidAmount,
    #[msg("Billing cadence must be greater than 0")]
    InvalidCadence,
}
