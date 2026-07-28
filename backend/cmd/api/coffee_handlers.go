package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/auth"
	"backend/internal/db"
)

func (s *APIServer) handleVerifyCoffeePayment(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok || claims == nil {
		writeError(w, http.StatusUnauthorized, ErrUnauthorized)
		return
	}

	if err := db.SetUserCoffeePaid(s.db, claims.UserID); err != nil {
		log.Printf("handleVerifyCoffeePayment: failed to mark coffee_paid: %v", err)
		writeError(w, http.StatusInternalServerError, ErrInternalError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Payment verified.",
	})
}

func (s *APIServer) handlePaymentStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok || claims == nil {
		writeError(w, http.StatusUnauthorized, ErrUnauthorized)
		return
	}

	paid, err := db.GetUserCoffeePaid(s.db, claims.UserID)
	if err != nil {
		log.Printf("handlePaymentStatus: failed to fetch coffee_paid: %v", err)
		writeError(w, http.StatusInternalServerError, ErrInternalError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"coffee_paid": paid,
	})
}

func coffeeRequired() bool {
	return os.Getenv("COFFEE_REQUIRED") == "true"
}

func freeTransferGB() int {
	if v := os.Getenv("FREE_TRANSFER_GB"); v != "" {
		var n int
		if _, err := fmt.Sscanf(v, "%d", &n); err == nil && n > 0 {
			return n
		}
	}
	return 100
}
