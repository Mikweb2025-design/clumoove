# Sistema Coffee & Free Tier — Documentazione Completa

## Indice
1. [Architettura Generale](#1-architettura-generale)
2. [AuthForm (Login/Register)](#2-authform-loginregister)
3. [MigrationsDashboard (Dashboard)](#3-migrationsdashboard-dashboard)
4. [App.tsx — Orchestratore](#4-apptsx--orchestratore)
5. [Backend — API Settings](#5-backend--api-settings)
6. [Design System & CSS](#6-design-system--css)
7. [Locale / i18n](#7-locale--i18n)
8. [Flussi Utente](#8-flussi-utente)

---

## 1. Architettura Generale

Il sistema **Coffee & Free Tier** implementa un modello "freemium":
- **Free Tier**: 100 GB di trasferimento gratis per ogni utente
- **Coffee Payment**: €2 una tantum via PayPal → rimuove il limite (coffee_paid = true)
- Il banner caffè appare solo quando il limite è **raggiunto**
- Una barra di utilizzo sottile mostra il consumo prima del limite
- La registrazione è accessibile **solo** dopo aver cliccato "Buy coffee"

### Flusso Dati

```
Frontend                          Backend
─────────────────────────────────────────────────
AuthForm (Buy coffee) ──────────► GET /api/settings
                                    │
AuthForm (register) ─────────────► POST /api/auth/register
                                    │
handleAuthSuccess ──────────────► POST /api/payment/verify
  (se pendingPayment = true)       │ sets coffee_paid = true
                                    │
MigrationsDashboard ────────────► GET /api/settings
  (ogni 15s con Bearer token)      │ + coffee_paid, total_bytes_transferred
                                    │
Worker (migration completa) ─────► UPDATE total_bytes_transferred += N
```

---

## 2. AuthForm (Login/Register)

**File**: `frontend/src/components/AuthForm.tsx` (686 linee)

### Props

| Prop | Tipo | Obbligatoria | Descrizione |
|------|------|-------------|-------------|
| `apiUrl` | `string` | ✅ | URL base API |
| `onAuthSuccess` | `(token, user) => void` | ✅ | Callback dopo login/register riuscito |
| `onGoToConnect` | `() => void` | ❌ | Imposta `pendingPayment = true` in App |

### State (16 variabili)

| Variabile | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `isLogin` | `boolean` | `true` | true = login, false = register |
| `email` | `string` | `''` | Input email |
| `password` | `string` | `''` | Input password |
| `displayName` | `string` | `''` | Solo register |
| `showPassword` | `boolean` | `false` | Mostra/nascondi password |
| `error` | `string` | `''` | Messaggio errore |
| `successMessage` | `string` | `''` | Messaggio successo |
| `loading` | `boolean` | `false` | Stato caricamento |
| `passwordResetAvailable` | `boolean` | `false` | SMTP configurato? |
| `forgotMode` | `boolean` | `false` | Mostra form forgot password |
| `resetEmailSent` | `boolean` | `false` | Email reset inviata |
| `totpSession` | `string` | `''` | Temp session per 2FA |
| `otpCode` | `string` | `''` | Codice OTP |
| `otpError` | `string` | `''` | Errore OTP |
| `lockSeconds` | `number` | `0` | Secondi di lockout 2FA |
| `mustChangeSession` | `string` | `''` | Temp session per cambio password obbligatorio |
| `newPassword` | `string` | `''` | Nuova password (must change) |
| `confirmNewPassword` | `string` | `''` | Conferma nuova password |
| `mustChangeError` | `string` | `''` | Errore cambio password |

### Effetti (useEffect)

**1. Password Reset Available** (dip: `apiUrl`)
```
GET /api/auth/password-reset-available → setPasswordResetAvailable(data.available)
```

**2. Lock Timer** (dip: `lockSeconds`)
```
Conto alla rovescia 1 secondo × lockSeconds
```

### Handler / Funzioni

**`handleSubmit`** — Login/Register principale
```
POST /api/auth/login    → temp_session? → 2FA | must_change | onAuthSuccess
POST /api/auth/register → setIsLogin(true) + successMessage
```

**`handleForgotPassword`** — Password dimenticata
```
POST /api/auth/forgot-password → setResetEmailSent(true)
```

**`handleOTPSubmit`** — Verifica 2FA
```
POST /api/auth/totp (con temp_session + code) → onAuthSuccess
Gestisce rate-limit 429 con lockSeconds
```

**`handleMustChangeSubmit`** — Cambio password obbligatorio
```
POST /api/auth/change-password (con temp_session) → onAuthSuccess
Validazione: length >= 12, new === confirm
```

### Render / UI Sezioni

AuthForm ha **4 modalità di render** mutualmente esclusive:

**1. mustChangeSession** attiva → Form cambio password:
- Header con icona Lock, titolo "Change Password"
- Input new + confirm password
- Bottone gradient arancione-oro

**2. totpSession** attiva → Form 2FA:
- Header con icona Lock, titolo "Two-Factor Authentication"
- Input OTP con tracking spacing
- Timer lockout countdown
- Bottone Verify + Cancel

**3. forgotMode** attiva → Form forgot password:
- Header con icona CloudSync
- Solo input email
- Bottone Send Link
- Back to Login link
- Stato "email sent" con feedback verde

**4. Default** (nessuna sessione) → Login/Register + Coffee Section:
- **Container**: glass-panel con glow arancione sfocato, top bar gradient
- **Brand Header**: icona CloudSync in box gradient, titolo dinamic (welcomeBack / createAccount), sottotitolo
- **Error/Success Box**: alert rosso/verde rounded-xl
- **Form**:
  - Display Name input (solo register, con icona User)
  - Email input (con icona Mail)
  - Password input (con icona Lock, toggle mostra/nascondi)
  - Forgot Password link (solo login, solo se SMTP configurato)
  - Submit button (con spinner loading, gradient arancione)
- **Footer**: in register mode → "Have an account? Login" link (arancione)
- **Coffee Section** (sotto il card, sempre visibile):
  - Sfondo gradient ambrato (from-amber-50 to-yellow-50)
  - Icona ☕ + descrizione "100 GB free, support with €2"
  - Bottone "€2 Buy" → apre PayPal + chiama `onGoToConnect` + passa a register

---

## 3. MigrationsDashboard (Dashboard)

**File**: `frontend/src/components/MigrationsDashboard.tsx` (617 linee)

### Props

| Prop | Tipo | Descrizione |
|------|------|-------------|
| `apiUrl` | `string` | URL base API |
| `token` | `string` | JWT Bearer token |
| `user` | `User \| null` | Utente loggato |
| `onStartNewMigration` | `() => void` | Naviga a connect |
| `onSelectActiveMigration` | `(id) => void` | Seleziona migrazione attiva |

### State (8 variabili)

| Variabile | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `migrations` | `Migration[]` | `[]` | Lista migrazioni |
| `loading` | `boolean` | `true` | Primo caricamento |
| `error` | `string` | `''` | Errore |
| `deleteLoading` | `string \| null` | `null` | ID migrazione in cancellazione |
| `freeTransferGB` | `number` | `100` | Limite GB free (da settings) |
| `usageBytes` | `number` | `0` | Bytes trasferiti (da settings) |
| `coffeePaid` | `boolean` | `false` | Pagato? (da settings) |

### Effetti (useEffect)

**1. SSE Stream** — Connessione persistente per aggiornamenti live (dip: `apiUrl, token`):
```
GET /api/migration/stream (Bearer token)
Parsing SSE: event:migrations → setMigrations(data)
Retry con exponential backoff: 2s → 4s → ... → 30s max
Cleanup: abort controller + clear timeout
```

**2. Settings Poll** — Aggiorna usage ogni 15 secondi (dip: `apiUrl, token`):
```
GET /api/settings (con Authorization: Bearer token)
→ free_transfer_gb: limite GB
→ coffee_paid: boolean
→ total_bytes_transferred: number di bytes
```

### Handler

**`handleDelete(id, e)`** — Cancella migrazione con conferma
```
DELETE /api/migration/{id}
→ setMigrations(prev.filter(m => m.id !== id))
```

**`getStatusBadge(status)`** — Badge colorato per stato migrazione:
| Stato | Colore | Icona |
|-------|--------|-------|
| COMPLETED | verde | CheckCircle2 |
| FAILED | rosso | XCircle |
| COMPLETED_WITH_ERRORS | ambra | AlertTriangle |
| CANCELLED | rosso | XCircle |
| RUNNING | blu (pulsante) | Loader2 spin |
| INDEXING | ambra | Loader2 spin |
| PAUSED* | grigio | — |

### Calcoli

| Variabile | Formula |
|-----------|---------|
| `activeMigrations` | `filter(status === RUNNING \|\| INDEXING).length` |
| `completedMigrations` | `filter(status === COMPLETED \|\| COMPLETED_WITH_ERRORS).length` |
| `failedMigrations` | `filter(status === FAILED \|\| CANCELLED).length` |
| `successRate` | `round((completed / (completed + failed)) * 100)` |
| `totalBytesMigrated` | `reduce(m.processed_bytes, 0)` |

### Render / UI Sezioni

**1. Welcome Banner** (sempre visibile):
- Sfondo gradient: `from-portal-navy via-slate-900 to-portal-navy-dark`
- Radiali glow arancione e blur
- Tagline, titolo con nome utente, sottotitolo
- Bottone "New Migration" gradient arancione-oro

**2. Coffee Banner** (visibile quando `!coffeePaid && usage >= limit`):
- Sfondo gradient ambrato (from-amber-50 to-yellow-50)
- Radial glow giallo
- ☕ + titolo + descrizione
- Bottone "Buy" → apre PayPal, chiede conferma, chiama `/api/payment/verify`

**3. Free Tier Usage Bar** (visibile quando `!coffeePaid && usage < limit`):
- Background sottile semitrasparente
- Label "Free Tier" + testo `X GB / 100 GB`
- Progress bar `h-2` con gradient `from-emerald-400 to-amber-400`
- Larghezza proporzionale: `(usageBytes / limit) * 100%`

**4. Stats Grid** (4 card, sempre visibili):
| Card | Icona | Colore | Valore |
|------|-------|--------|--------|
| Data Transferred | HardDrive | blu | `formatBytes(totalBytesMigrated)` |
| Migrations | Layers | viola | `migrations.length` |
| Active | RefreshCw | verde (spin se >0) | `activeMigrations` |
| Success Rate | CheckCircle2 | ambra | `successRate%` |

Ogni card: glass-panel con icona in box colorata, label uppercase, valore bold.

**5. Lista Migrazioni** (non documentata in dettaglio qui)

---

## 4. App.tsx — Orchestratore

**File**: `frontend/src/App.tsx` (1143 linee)

### State Rilevante

| Variabile | Tipo | Default | Ruolo |
|-----------|------|---------|-------|
| `user` | `User \| null` | `null` | Utente loggato |
| `token` | `string` | `''` | JWT token |
| `pendingPayment` | `boolean` | `false` | In attesa di verify dopo register |

### `handleAuthSuccess(token, user)`
```typescript
setToken(token)
setUser(user)
if (pendingPayment) {
  setPendingPayment(false)
  POST /api/payment/verify (Authorization: Bearer token)  // ignora errori
  navigate('connect')
} else {
  navigate('history')  // dashboard normale
}
```

### Render AuthForm
```tsx
<AuthForm
  apiUrl={API_URL}
  onAuthSuccess={handleAuthSuccess}
  onGoToConnect={() => setPendingPayment(true)}
/>
```

### Render MigrationsDashboard
```tsx
<MigrationsDashboard
  apiUrl={API_URL}
  token={token}
  user={user}
  onStartNewMigration={() => navigate('connect')}
  onSelectActiveMigration={(id) => navigate('dashboard', id)}
/>
```

---

## 5. Backend — API Settings

**File**: `backend/cmd/api/main.go`

### `handleGetSettings` (riga 3732)

Endpoint pubblico `GET /api/settings`. Prima leggge tutte le impostazioni di sistema, poi **arricchisce con dati utente** se il JWT è presente:

```go
// 1. Impostazioni pubbliche
resp = {
  registrations_enabled: "true",
  local_storage_enabled: boolean,
  oauth_providers: {...},
  paypal_email: string,
  coffee_price: "2.00",
  free_transfer_gb: "100",
  coffee_required: "true",
}

// 2. Se JWT presente (via middleware context o header manuale):
if claims valid:
  user = db.GetUserByID(claims.UserID)
  resp.coffee_paid = user.CoffeePaid           // boolean
  resp.total_bytes_transferred = user.TotalBytesTransferred  // int64
```

Il fallback manuale sull'Authorization header è necessario perché la rotta non usa `AuthMiddleware` (deve funzionare anche senza autenticazione).

### `handleUpdateSetting` (riga ~3789)

Endpoint autenticato `PUT /api/settings`. Solo admin può modificare.
Chiavi supportate (tra cui):
- `free_transfer_gb` → modifica il limite globale
- `coffee_required` → attiva/disattiva enforcement (valori: `"true"` / `"false"`)

### `handleStart` (creazione migrazione, riga ~1777)

Controllo del limite free-tier:
```go
if coffeeRequired == "true" && !user.CoffeePaid && user.TotalBytesTransferred >= freeBytes {
  return coffee limit reached error
}
```

### Chiamate DB

| Funzione | Descrizione |
|----------|-------------|
| `AddUserTransferredBytes(db, userID, bytes)` | `UPDATE users SET total_bytes_transferred = total_bytes_transferred + $1` |
| `GetSetting(db, key)` | Legge valore dalla tabella `settings` |
| `SetSetting(db, key, value)` | Scrive/aggiorna nella tabella `settings` |

---

## 6. Design System & CSS

**File**: `frontend/src/index.css` (211 linee, Tailwind v4)

### Color Palette

| Token | Valore | Utilizzo |
|-------|--------|----------|
| `--color-portal-navy` | `#1e3a8a` | Sfondo banner principale |
| `--color-portal-navy-dark` | `#1e3a8a` | Sfondo aggiuntivo |
| `--color-portal-navy-light` | `#2563eb` | Accenti blu |
| `--color-portal-orange` | `#ffd700` | Oro/arancione brand principale |
| `--color-portal-orange-hover` | `#e6c200` | Hover arancione |
| `--color-portal-orange-themed` | `#ffd700` | Tema dinamico |
| `--color-portal-navy-themed` | `#1e3a8a` | Tema dinamico |
| `--color-bg-primary` | `#f8fafc` | Sfondo pagina |
| `--color-bg-secondary` | `#ffffff` | Sfondo card/input |
| `--color-bg-tertiary` | `#f1f5f9` | Sfondo terziario |
| `--color-text-primary` | `#0f172a` | Testo principale |
| `--color-text-secondary` | `#475569` | Testo secondario |
| `--color-text-muted` | `#94a3b8` | Testo attenuato |
| `--color-text-inverse` | `#ffffff` | Testo su sfondo scuro |
| `--color-border` | `#e2e8f0` | Bordi |
| `--color-border-light` | `#f1f5f9` | Bordi leggeri |
| `--color-shadow` | `rgba(0,47,108,0.04)` | Ombre card |
| `--color-shadow-dark` | `rgba(0,0,0,0.02)` | Ombre profonde |

### States

| Token | Ruolo |
|-------|-------|
| `--color-error-bg` | `#fef2f2` (sfondo errore) |
| `--color-error-border` | `#fecdd3` (bordo errore) |
| `--color-info-bg` | (blu, usato per info badge) |
| `--color-info-border` | (blu, bordo info badge) |

### Utility Tailwind Custom

| Utility | CSS |
|---------|-----|
| `glass-panel` | `bg-[var(--color-glass-bg)] backdrop-blur(12px) border-[var(--color-glass-border)]` |
| `glass-panel-dark` | `bg-[rgba(15,23,42,0.8)] backdrop-blur(16px) border-[rgba(255,255,255,0.05)]` |
| `shadow-portal` | `box-shadow: 0 4px 20px -2px var(--color-shadow), 0 2px 6px -1px var(--color-shadow-dark)` |
| `shadow-portal-hover` | `box-shadow: 0 16px 32px -4px var(--color-shadow), 0 6px 12px -2px var(--color-shadow-dark)` |
| `scrollbar-portal` | Scrollbar personalizzata 6px arrotondata |

### Font

| Utility | Font |
|---------|------|
| `font-display` | `'Poppins', system-ui, sans-serif` |
| `font-mono` | `'Open Sans', system-ui, sans-serif` |

### Pattern UI Ricorrenti

- **Card**: `glass-panel rounded-3xl p-8 shadow-portal border border-[var(--color-glass-border)]`
- **Input**: `w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-portal-orange/30 focus:border-portal-orange`
- **Button primario**: `bg-gradient-to-r from-portal-orange to-yellow-500 text-portal-navy px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`
- **Icon container**: `p-3 bg-gradient-to-tr from-portal-orange to-yellow-500 rounded-2xl text-portal-navy`
- **Alert errore**: `p-3.5 rounded-xl border text-xs bg-rose-50/80 border-rose-250 text-rose-800`
- **Alert successo**: `p-3.5 rounded-xl border text-xs bg-emerald-50/80 border-emerald-200 text-emerald-800`
- **Top bar card**: `absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-portal-orange via-orange-500 to-portal-navy`
- **Glow sfondo**: `absolute -top-10 -left-10 w-40 h-40 bg-portal-orange/10 rounded-full blur-3xl pointer-events-none`

### Coffee Section Specifics

**AuthForm coffee card:**
```
rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 text-amber-900 shadow-sm
```

**Dashboard coffee banner:**
```
rounded-2xl p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 text-amber-900
  + radial-gradient circle_at_100%_0% rgba(255,200,50,0.12)
```

**Coffee button:**
```
bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white
```

**Free tier bar:**
```
h-2 bg-[var(--color-bg-secondary)] rounded-full
  + bg-gradient-to-r from-emerald-400 to-amber-400
```

### Responsive

- Stats grid: `grid-cols-2 lg:grid-cols-4 gap-4`
- Coffee banner: `flex-col sm:flex-row`
- Welcome banner: `flex-col md:flex-row`

---

## 7. Locale / i18n

**File**: `frontend/src/locales/{en,de}/translation.json`

### Chiavi Coffee

| Chiave | EN | DE |
|--------|----|-----|
| `coffee.title` | ☕ Buy me a coffee | ☕ Kauf mir einen Kaffee |
| `coffee.description` | 100 GB transfer for free. Support the project with €2. | 100 GB kostenlos übertragen. Unterstütze das Projekt mit €2. |
| `coffee.usage` | `{{used}} / {{total}}` | `{{used}} / {{total}}` |
| `coffee.freeTier` | Free Tier | Kostenloses Kontingent |
| `coffee.buy` | Buy | Kaufen |
| `coffee.registerToActivate` | Register to activate transfers | Registrieren zum Aktivieren |
| `coffee.notConfigured` | Payment not configured | Zahlung nicht konfiguriert |
| `coffee.afterPay` | After payment, refresh the page | Nach Zahlung Seite aktualisieren |
| `coffee.paymentFailed` | Payment verification failed | Zahlungsbestätigung fehlgeschlagen |
| `coffee.paypalConfirm` | Did you complete the payment? | Hast du die Zahlung abgeschlossen? |

### Chiavi Auth (selezione)

| Chiave | EN | DE |
|--------|----|-----|
| `auth.welcomeBack` | Welcome back | Willkommen zurück |
| `auth.createAccount` | Create account | Konto erstellen |
| `auth.portalLogin` | Login | Anmelden |
| `auth.portalRegister` | Register | Registrieren |
| `auth.login` | Login | Anmelden |
| `auth.register` | Register | Registrieren |
| `auth.noAccount` | Don't have an account? | Noch kein Konto? |
| `auth.haveAccount` | Already have an account? | Bereits ein Konto? |
| `auth.registrationsDisabled` | Registration is currently disabled | Registrierung deaktiviert |
| `auth.registrationSuccess` | Registration successful! You can now log in. | Registrierung erfolgreich! |

---

## 8. Flussi Utente

### Flusso A: Nuovo utente — Pagamento + Registrazione

```
1. Pagina login → sezione ☕
2. Clicca "€2 Buy"
   ├── PayPal si apre in nuova tab (opzionale, facoltativo)
   └── onGoToConnect() → pendingPayment = true
   └── setIsLogin(false) → passa a register mode
3. Compila form register (nome, email, password)
4. Clicca Register
   ├── POST /api/auth/register
   └── onAuthSuccess(token, user)
       ├── pendingPayment = true
       ├── POST /api/payment/verify → coffee_paid = true
       └── navigate('connect')
5. Crea migrazione → dashboard
6. Dashboard: coffeePaid = true → barra/banner nascosti
```

### Flusso B: Utente registrato — Free tier

```
1. Login normale    (pendingPayment = false)
2. navigate('history') → dashboard
3. Dashboard:
   ├── coffeePaid = false, usageBytes < 100 GB
   └── Mostra Free Tier bar (X GB / 100 GB)
4. Crea migrazioni → usageBytes aumenta
5. Quando usageBytes >= 100 GB:
   ├── Free bar scompare
   └── Coffee banner appare → può pagare €2
```

### Flusso C: Utente che ha pagato

```
1. Login normale
2. Dashboard:
   ├── coffeePaid = true
   └── Nessuna barra, nessun banner
3. Nessun limite: può creare migrazioni illimitate
```

### Flusso D: Admin — Disabilita coffee_required

```
1. Admin Panel → toggle "Require Coffee Payment" = off
2. Backend: coffee_required = "false"
3. handleStart salta il controllo limite
4. Tutti gli utenti possono migrare senza pagare
```
