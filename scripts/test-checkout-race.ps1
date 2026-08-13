<#
  F1 concurrency test: fires two POST /api/orders/create requests at the
  same last-remaining product_size row, as close to simultaneously as
  PowerShell allows, using two background jobs.

  Background — why the payload looks like this:
    - src/app/api/orders/create/route.ts expects body = { order: {...}, items: [...] }
    - There is no "product_size_id". product_sizes is keyed by (product_id, size)
      -- see supabase/migrations/034_atomic_order_creation.sql -- so each item
      needs product_id (uuid) + size (string, e.g. "US 9"), not a size id.
    - Auth is cookie-based only (src/lib/supabase/server.ts builds the Supabase
      server client from Next's cookies()). There's no Authorization/Bearer
      handling anywhere in the route, so a bearer token will NOT authenticate
      this endpoint -- you must paste your session cookie(s) below.
#>

# ============================================================
# FILL THESE IN
# ============================================================

# The product/size you want to race for (must currently have stock = 1,
# or whatever quantity you want both requests to compete over).
$ProductId  = "00000000-0000-0000-0000-000000000000"   # <-- product UUID
$Size       = "US 9"                                     # <-- exact size string as stored in product_sizes.size
$UnitPrice  = 100                                          # <-- size price (numeric, e.g. 3495)
$ProductName = "Test Product"                              # <-- cosmetic only, shown in order_items
$Brand       = "Test Brand"                                 # <-- cosmetic only

# Your logged-in session cookie(s), copied from DevTools > Application > Cookies
# on http://localhost:3000, after logging in as a real user on that origin.
# Supabase splits large JWTs into "sb-<project-ref>-auth-token.0" and ".1" --
# grab EVERY cookie whose name starts with "sb-" and paste them all here as one
# semicolon-separated string, e.g.:
#   'sb-abcdefgh-auth-token=base64-...; sb-abcdefgh-auth-token.0=...; sb-abcdefgh-auth-token.1=...'
$AuthCookie = "PASTE_YOUR_COOKIE_HEADER_HERE"

# ============================================================
# END FILL-IN SECTION
# ============================================================

$ApiUrl = "http://localhost:3000/api/orders/create"

if ($AuthCookie -eq "PASTE_YOUR_COOKIE_HEADER_HERE" -or $ProductId -eq "00000000-0000-0000-0000-000000000000") {
    Write-Host "Edit the FILL THESE IN section at the top of this script before running." -ForegroundColor Yellow
    exit 1
}

function New-OrderPayload {
    param([string]$Suffix)

    # order_number just needs to be unique per request -- two real browser
    # tabs would each generate their own via Date.now(), so we mimic that.
    $orderNumber = "SND-RACE-$(Get-Date -Format 'HHmmssfff')-$Suffix"

    $order = @{
        order_number      = $orderNumber
        customer_name     = "Race Test $Suffix"
        customer_email    = "race-test-$Suffix@example.com"
        customer_mobile   = "09171234567"          # must match ^09\d{9}$
        shipping_street   = "123 Test St."
        shipping_barangay = "Test Barangay"
        shipping_city     = "Test City"
        shipping_province = "Test Province"
        shipping_postal   = "1000"
        subtotal          = $UnitPrice
        shipping_fee      = 0
        discount          = 0
        coupon_code       = $null
        total             = $UnitPrice              # route.ts validates 0 < total <= 1,000,000
        payment_method    = "cod"                    # must be one of: gcash, maya, bank_transfer, cod
        payment_type      = "full"
        payment_status    = "pending"
        proof_of_payment  = $null
        payment_reference = "RACE-$Suffix"
    }

    $items = @(
        @{
            product_id   = $ProductId
            product_name = $ProductName
            brand        = $Brand
            size         = $Size
            quantity     = 1
            unit_price   = $UnitPrice
            payment_type = "full"
        }
    )

    return @{ order = $order; items = $items } | ConvertTo-Json -Depth 10
}

$bodyA = New-OrderPayload -Suffix "A"
$bodyB = New-OrderPayload -Suffix "B"

# Each job gets its own headers/body -- Start-Job runs in a separate process
# with no access to this scope, so everything needed must be passed via -ArgumentList.
$scriptBlock = {
    param($Url, $Cookie, $Body, $Label)

    $headers = @{
        "Content-Type" = "application/json"
        "Cookie"       = $Cookie
    }

    $result = [ordered]@{
        Label      = $Label
        StatusCode = $null
        Body       = $null
        Error      = $null
    }

    try {
        $resp = Invoke-WebRequest -Uri $Url -Method Post -Headers $headers -Body $Body -UseBasicParsing
        $result.StatusCode = [int]$resp.StatusCode
        $result.Body       = $resp.Content
    }
    catch {
        # Invoke-WebRequest throws on non-2xx -- the real status/body is on the exception response
        if ($_.Exception.Response) {
            $result.StatusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $result.Body = $reader.ReadToEnd()
            } catch {
                $result.Body = "(could not read error body)"
            }
        } else {
            $result.Error = $_.Exception.Message
        }
    }

    return [pscustomobject]$result
}

Write-Host "Firing two concurrent requests at $ApiUrl ..." -ForegroundColor Cyan

$jobA = Start-Job -ScriptBlock $scriptBlock -ArgumentList $ApiUrl, $AuthCookie, $bodyA, "Request A"
$jobB = Start-Job -ScriptBlock $scriptBlock -ArgumentList $ApiUrl, $AuthCookie, $bodyB, "Request B"

Wait-Job -Job $jobA, $jobB | Out-Null

$resultA = Receive-Job -Job $jobA
$resultB = Receive-Job -Job $jobB

Remove-Job -Job $jobA, $jobB

Write-Host "`n=== Results ===" -ForegroundColor Cyan
foreach ($r in @($resultA, $resultB)) {
    Write-Host "`n--- $($r.Label) ---" -ForegroundColor Yellow
    if ($r.Error) {
        Write-Host "Transport error: $($r.Error)" -ForegroundColor Red
    } else {
        Write-Host "Status: $($r.StatusCode)"
        Write-Host "Body:   $($r.Body)"
    }
}

Write-Host "`n=== Expected outcome for a correct F1 fix ===" -ForegroundColor Cyan
Write-Host "If stock for this size was 1: exactly ONE request should return 201 (order created)"
Write-Host "and the OTHER should return 409 with outOfStock:true / 'sold out'."
Write-Host "Two 201s means the fix failed to prevent overselling."
