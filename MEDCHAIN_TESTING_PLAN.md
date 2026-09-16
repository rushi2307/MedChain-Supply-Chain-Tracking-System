# MedChain Complete Testing Plan

## 1. Test Environment

Current mode:

```text
Frontend: http://localhost:5173
Backend: http://localhost:5000
API base: http://localhost:5000/api
Blockchain mode: local-demo
Chain ID: 31337
Database: MongoDB medchain database
Real Ethereum: Disabled
```

The local demo blockchain creates fake transaction hashes and block numbers. These values are saved in MongoDB and displayed by the frontend.

## 2. Start the System

Open two terminals from the project root.

### Terminal 1: Backend

```powershell
cd backend
npm start
```

Expected output:

```text
database.connected
server.started
network: local-demo
```

### Terminal 2: Frontend

```powershell
cd frontend
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

## 3. Test Credentials

Super Admin:

```text
Username: sadmin
Password: 123456
```

Every newly created local browser account uses:

```text
Password: 123456
```

Passwords are stored in the browser as salted PBKDF2 hashes, not plain text.

## 4. Test 1: Home Page and Blockchain Feed

1. Open `http://localhost:5173`.
2. Scroll to the blockchain panel.
3. Confirm the panel says `Local Demo Ethereum`.
4. Confirm transactions display:
   - Medicine name
   - Batch number
   - Transaction hash
   - Block number
   - Confirmation count
   - `Confirmed` status
5. Add enough records later to confirm the panel scrolls internally.
6. Confirm the home page itself remains usable and does not expand indefinitely.

Expected result: the feed shows database-backed demo blockchain activity without calling Sepolia or mainnet.

## 5. Test 2: Manufacturer Registration

1. Select **Create account**.
2. Enter a new email address.
3. Select `Manufacturer`.
4. Submit the account form.
5. Login using the email and `123456`.
6. Enter medicine information:
   - Medicine name: `Test Medicine Alpha`
   - Batch number: `TEST-ALPHA-001`
   - Manufacturing date
   - Future expiry date
   - Chemical components: `Component A`
   - Quantity: `100`
7. Submit the registration form.

Expected result:

- Registration succeeds.
- A QR code is generated.
- The medicine appears in inventory.
- A transaction hash and block number are stored.
- Home blockchain feed shows the new record as `Confirmed` on `Local Demo Ethereum`.

Negative test:

- Submit without a name, batch, expiry date, or chemical components.
- Confirm the form displays a validation error.

## 6. Test 3: Distributor Order

1. Return to the home page or sign out.
2. Create a `Distributor` account.
3. Login with the Distributor account and `123456`.
4. Open **Available stock**.
5. Select `Test Medicine Alpha`.
6. Enter quantity `10`.
7. Select **Confirm order**.

Expected result:

- Order succeeds.
- Quantity changes from `100` to `90`.
- Medicine status becomes `InTransit`.
- Distributor sees the order under **My orders**.
- A new fake transaction hash and block number are saved in MongoDB.
- Home blockchain feed shows the distribution transaction.

Negative tests:

- Try quantity `0`.
- Try a quantity greater than available stock.
- Confirm the request is rejected.

## 7. Test 4: Retailer Order

1. Create a `Retailer` account.
2. Login with the Retailer account and `123456`.
3. Open **Available stock**.
4. Place an order for a valid quantity.
5. Open **My orders**.
6. Open **Store inventory**.

Expected result:

- Order is created.
- Quantity is reduced.
- Order is associated with the retailer email.
- The order appears in the retailer workspace.
- A demo transaction is saved in MongoDB.

## 8. Test 5: Super Admin Order Acceptance

1. Sign out.
2. Select **Super Admin**.
3. Login with:

   ```text
   Username: sadmin
   Password: 123456
   ```

4. Open **Order approvals**.
5. Find an order with status `InTransit`.
6. Select **Accept order**.

Expected result:

- Order status changes from `InTransit` to `Stored`.
- The medicine record is updated in MongoDB.
- A new demo transaction hash and block number are saved.
- The UI confirms the medicine was updated and blockchain status synchronized.
- The home feed shows the latest status as `Confirmed`.

## 9. Test 6: QR Verification

1. Login as Retailer or Consumer.
2. Open **Verify QR** or **Verify with QR**.
3. Open the QR code generated during Manufacturer registration.
4. Scan it with the camera.

Expected result:

- QR data is captured.
- Medicine identity details appear.
- Batch number and medicine name match the registered record.

If camera permissions are unavailable, use a device with a camera or test the scanner in a browser that allows camera access.

## 10. Test 7: Consumer Search

1. Create or login as a `Consumer`.
2. Search for `Test Medicine Alpha`.
3. Search for batch `TEST-ALPHA-001`.
4. Select the result.
5. Review the medicine details.

Expected result:

- Search works by medicine name.
- Search works by batch number.
- Manufacturer, expiry, quantity, and status are displayed.
- QR verification is available.

## 11. Test 8: Admin User Management

1. Login as Super Admin.
2. Open **User directory**.
3. Change a user's role.
4. Save the role.
5. Enter a new password with at least six characters.
6. Reset the user's password.
7. Sign out and login as that user.

Expected result:

- Role change is saved in browser local storage.
- Password reset succeeds.
- The password is stored as a PBKDF2 hash.
- The user can login with the new password.

## 12. API Smoke Tests

Run these from PowerShell while the backend is running.

### Backend health

```powershell
Invoke-WebRequest http://localhost:5000/
```

Expected response:

```text
MedChain Backend is Running!
```

### Medicine list

```powershell
Invoke-RestMethod http://localhost:5000/api/medicines
```

Expected result: a JSON array of medicine records.

### Demo blockchain feed

```powershell
Invoke-RestMethod http://localhost:5000/api/medicines/transactions/feed
```

Expected fields:

```text
available: true
demo: true
network: local-demo
chainId: 31337
transactions: array
```

Each transaction should contain a hash, block number, status, and confirmation count.

## 13. Database Verification

For every registered medicine, confirm MongoDB contains:

```text
blockchainTransactionHash
blockchainBlockNumber
blockchainNetwork: local-demo
name
batchNumber
status
quantity
```

For every order, confirm:

```text
orderedQuantity
orderDate
distributor or retailer
status: InTransit or Stored
blockchainTransactionHash
blockchainBlockNumber
```

## 14. Authentication Tests

Test each of these:

- Correct password succeeds.
- Wrong password fails.
- Wrong role fails.
- Unknown email fails.
- Duplicate signup email fails.
- Super Admin rejects any username except `sadmin`.
- Super Admin rejects any password except `123456`.
- Existing users are migrated to hashed passwords after page load.

## 15. Final Acceptance Checklist

- [ ] Frontend opens on port 5173.
- [ ] Backend responds on port 5000.
- [ ] MongoDB connection succeeds.
- [ ] Home blockchain feed displays local demo transactions.
- [ ] Manufacturer can register medicine.
- [ ] QR code is generated.
- [ ] Distributor can place an order.
- [ ] Retailer can place an order.
- [ ] Super Admin can accept an order.
- [ ] Status changes from `InTransit` to `Stored`.
- [ ] Fake transaction hash is saved in MongoDB.
- [ ] Block number is saved in MongoDB.
- [ ] Consumer can search medicine.
- [ ] QR verification works.
- [ ] Passwords are hashed in browser storage.
- [ ] Transaction panel scrolls when records increase.

## 16. Expected Demo Limitations

This environment is intentionally simulated:

- No transaction is broadcast to Ethereum.
- Etherscan links are not available.
- Demo hashes are not publicly verifiable.
- Browser accounts are stored in local storage.
- MongoDB is the persistent source of truth for medicine and transaction records.
