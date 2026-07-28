package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"backend/internal/auth"
	"backend/internal/db"
)

type PayPalAccessToken struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

type PayPalOrderRequest struct {
	Intent string             `json:"intent"`
	PurchaseUnits []PayPalPurchaseUnit `json:"purchase_units"`
}

type PayPalPurchaseUnit struct {
	Description string         `json:"description"`
	Amount      PayPalAmount   `json:"amount"`
}

type PayPalAmount struct {
	CurrencyCode string `json:"currency_code"`
	Value        string `json:"value"`
}

type PayPalOrderResponse struct {
	ID     string            `json:"id"`
	Status string            `json:"status"`
	Links  []PayPalLink      `json:"links"`
}

type PayPalLink struct {
	Href   string `json:"href"`
	Rel    string `json:"rel"`
	Method string `json:"method"`
}

type PayPalCaptureResponse struct {
	ID     string            `json:"id"`
	Status string            `json:"status"`
}

type PaypalCreateOrderResponse struct {
	Success      bool   `json:"success"`
	OrderID      string `json:"order_id,omitempty"`
	ApprovalURL  string `json:"approval_url,omitempty"`
	Error        string `json:"error,omitempty"`
}

type PaypalCaptureOrderResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

func getPayPalClientID() string {
	return os.Getenv("PAYPAL_CLIENT_ID")
}

func getPayPalClientSecret() string {
	return os.Getenv("PAYPAL_CLIENT_SECRET")
}

func isPayPalConfigured() bool {
	return getPayPalClientID() != "" && getPayPalClientSecret() != ""
}

func getPayPalAccessToken() (string, error) {
	clientID := getPayPalClientID()
	clientSecret := getPayPalClientSecret()

	body := []byte("grant_type=client_credentials")
	req, err := http.NewRequest("POST", "https://api-m.paypal.com/v1/oauth2/token", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}
	req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get PayPal access token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("paypal token request failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var token PayPalAccessToken
	if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {
		return "", fmt.Errorf("failed to decode PayPal token response: %w", err)
	}

	return token.AccessToken, nil
}

func (s *APIServer) handleCreatePayPalOrder(w http.ResponseWriter, r *http.Request) {
	if !isPayPalConfigured() {
		writeJSON(w, http.StatusBadRequest, PaypalCreateOrderResponse{
			Success: false,
			Error:   "PayPal API not configured. Contact admin to set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
		})
		return
	}

	accessToken, err := getPayPalAccessToken()
	if err != nil {
		log.Printf("PayPal access token error: %v", err)
		writeJSON(w, http.StatusInternalServerError, PaypalCreateOrderResponse{
			Success: false,
			Error:   "Failed to authenticate with PayPal",
		})
		return
	}

	orderReq := PayPalOrderRequest{
		Intent: "CAPTURE",
		PurchaseUnits: []PayPalPurchaseUnit{
			{
				Description: "Buy me a coffee - Clumoove 100 GB bonus",
				Amount: PayPalAmount{
					CurrencyCode: "EUR",
					Value:        "2.00",
				},
			},
		},
	}

	body, _ := json.Marshal(orderReq)
	req, err := http.NewRequest("POST", "https://api-m.paypal.com/v2/checkout/orders", bytes.NewReader(body))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, PaypalCreateOrderResponse{Success: false, Error: "Internal error"})
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("PayPal create order error: %v", err)
		writeJSON(w, http.StatusInternalServerError, PaypalCreateOrderResponse{Success: false, Error: "Failed to create PayPal order"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("PayPal create order failed (HTTP %d): %s", resp.StatusCode, string(respBody))
		writeJSON(w, http.StatusInternalServerError, PaypalCreateOrderResponse{Success: false, Error: "PayPal order creation failed"})
		return
	}

	var order PayPalOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&order); err != nil {
		writeJSON(w, http.StatusInternalServerError, PaypalCreateOrderResponse{Success: false, Error: "Failed to parse PayPal response"})
		return
	}

	var approvalURL string
	for _, link := range order.Links {
		if link.Rel == "approve" || link.Rel == "payer-action" {
			approvalURL = link.Href
			break
		}
	}

	writeJSON(w, http.StatusOK, PaypalCreateOrderResponse{
		Success:     true,
		OrderID:     order.ID,
		ApprovalURL: approvalURL,
	})
}

func (s *APIServer) handleCapturePayPalOrder(w http.ResponseWriter, r *http.Request) {
	if !isPayPalConfigured() {
		writeJSON(w, http.StatusBadRequest, PaypalCaptureOrderResponse{
			Success: false,
			Message: "PayPal API not configured.",
		})
		return
	}

	var req struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OrderID == "" {
		writeJSON(w, http.StatusBadRequest, PaypalCaptureOrderResponse{Success: false, Message: "order_id required"})
		return
	}

	accessToken, err := getPayPalAccessToken()
	if err != nil {
		log.Printf("PayPal access token error: %v", err)
		writeJSON(w, http.StatusInternalServerError, PaypalCaptureOrderResponse{Success: false, Message: "Failed to authenticate with PayPal"})
		return
	}

	captureURL := fmt.Sprintf("https://api-m.paypal.com/v2/checkout/orders/%s/capture", req.OrderID)
	httpReq, err := http.NewRequest("POST", captureURL, bytes.NewReader([]byte("{}")))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, PaypalCaptureOrderResponse{Success: false, Message: "Internal error"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		log.Printf("PayPal capture order error: %v", err)
		writeJSON(w, http.StatusInternalServerError, PaypalCaptureOrderResponse{Success: false, Message: "Failed to capture PayPal order"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("PayPal capture failed (HTTP %d): %s", resp.StatusCode, string(respBody))
		writeJSON(w, http.StatusOK, PaypalCaptureOrderResponse{Success: false, Message: "Payment not completed. Please try again."})
		return
	}

	var capture PayPalCaptureResponse
	if err := json.NewDecoder(resp.Body).Decode(&capture); err != nil {
		writeJSON(w, http.StatusInternalServerError, PaypalCaptureOrderResponse{Success: false, Message: "Failed to parse PayPal response"})
		return
	}

	if capture.Status != "COMPLETED" {
		writeJSON(w, http.StatusOK, PaypalCaptureOrderResponse{Success: false, Message: "Payment not completed. Status: " + capture.Status})
		return
	}

	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok || claims == nil {
		writeError(w, http.StatusUnauthorized, ErrUnauthorized)
		return
	}

	if err := db.SetUserCoffeePaid(s.db, claims.UserID); err != nil {
		log.Printf("Failed to mark user coffee_paid: %v", err)
		writeJSON(w, http.StatusInternalServerError, PaypalCaptureOrderResponse{Success: false, Message: "Failed to activate storage"})
		return
	}

	writeJSON(w, http.StatusOK, PaypalCaptureOrderResponse{
		Success: true,
		Message: "Payment confirmed! Your 100 GB bonus is now active.",
	})
}
