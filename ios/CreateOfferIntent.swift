
import AppIntents

struct CreateOfferIntent: AppIntent {
    static var title: LocalizedStringResource = "Create Guest Offer"

    @Parameter(title: "Reservation ID") var reservationId: String
    @Parameter(title: "Discount %") var discountPct: Double

    func perform() async throws -> some IntentResult {
        // Call your backend or open app screen.
        return .result()
    }
}
