// All SMS template functions for MakaziHub
// Each function returns a typed SMS message string

export const smsTemplates = {
  signupOtp: (otp: string): string =>
    `Your MakaziHub verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,

  listingPublished: (estate: string, listingId: string): string =>
    `Your listing at ${estate} is live on MakaziHub. makazihub.co.ke/listings/${listingId}`,

  contactUnlocked: (estate: string): string =>
    `A tenant just unlocked your ${estate} listing. Check your inbox: makazihub.co.ke/lister/inbox`,

  searchAlertMatch: (bedrooms: number, estate: string, rent: number, listingId: string): string =>
    `New ${bedrooms}BR in ${estate} for KES ${rent.toLocaleString()}/month matches your alert. View: makazihub.co.ke/listings/${listingId}`,

  paymentFailed: (): string =>
    `Your M-Pesa payment for MakaziHub did not go through. Please try again or contact support.`,

  listingExpiryWarning: (estate: string): string =>
    `Your listing at ${estate} expires in 7 days. Log in to confirm it is still available: makazihub.co.ke/lister/listings`,

  idVerificationApproved: (): string =>
    `Your ID has been verified on MakaziHub. Your Verified badge is now live on your listings.`,

  fraudAutoRefund: (estate: string, credits: number): string =>
    `Your KES 100 unlock fee for ${estate} has been refunded as a credit. Balance: ${credits} credits.`,

  escrowDepositReceived: (estate: string): string =>
    `A tenant has paid a holding deposit for your ${estate} listing. Confirm move-in within 7 days at makazihub.co.ke/lister/inbox`,

  paymentTimedOut: (): string =>
    `Your MakaziHub M-Pesa payment prompt expired. Please try again when you are ready.`,

  subscriptionRenewalReminder: (planName: string, expiresAt: string): string =>
    `Your MakaziHub ${planName} plan expires on ${expiresAt}. Renew now to keep your listings active: makazihub.co.ke/lister/billing`,

  planDowngraded: (planName: string): string =>
    `Your MakaziHub ${planName} plan has expired and your account has been moved to the free tier. Renew at makazihub.co.ke/lister/billing`,

  csvImportComplete: (imported: number, errors: number): string =>
    `MakaziHub import complete: ${imported} listings imported successfully. ${errors > 0 ? `${errors} rows had errors.` : ''}`.trim(),

  escrowAutoRefunded: (estate: string): string =>
    `Your holding deposit for ${estate} has been refunded to your M-Pesa as the move-in was not confirmed within 7 days.`,
}
