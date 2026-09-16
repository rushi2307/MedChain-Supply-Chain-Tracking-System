# MedChain User Manual

## 1. Start the system

1. Open a terminal in the project root.
2. Start MongoDB.
3. Start the backend:

   ```powershell
   cd backend
   npm install
   npm start
   ```

4. Open another terminal and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## 2. Login credentials

All existing browser accounts are migrated to this password on the next page load:

```text
123456
```

The Super Admin login is:

```text
Username: sadmin
Password: 123456
```

New accounts also use `123456` as their password, regardless of the value typed into the signup form.

## 3. Create a user account

1. On the home page, select **Create account**.
2. Enter an email address.
3. Select a role: Manufacturer, Distributor, Retailer, or Consumer.
4. Submit the form.
5. Sign in using the email and password `123456`.

Accounts are stored in the browser's local storage for this demo application. Passwords are stored as salted PBKDF2-SHA-256 hashes with 120,000 iterations; the plain password is not stored.

## 4. Manufacturer workflow

1. Sign in as **Manufacturer**.
2. Enter the medicine name, batch number, expiry date, chemical components, and any optional details.
3. Submit the registration form.
4. Wait for the success notice and QR code.
5. The medicine appears in the inventory list with its transaction hash and blockchain record details.

Registration requires a working Ethereum provider because it writes the medicine to the contract.

## 5. Distributor workflow

1. Sign in as **Distributor**.
2. Open **Available stock**.
3. Select a medicine and enter a quantity.
4. Select **Confirm order**.
5. The quantity is reduced and the order becomes **InTransit**.
6. The order appears under **My orders**.

## 6. Retailer workflow

1. Sign in as **Retailer**.
2. Use **Available stock** to place an order.
3. Use **Store inventory** to view stock assigned to the retailer.
4. Use **Verify QR** to scan a medicine identity before accepting it.

## 7. Super Admin workflow

1. Select **Super Admin** on the home page.
2. Login with `sadmin` and `123456`.
3. Open **Order approvals**.
4. Find an order with status **InTransit**.
5. Select **Accept order**.
6. The medicine changes to **Stored** and the order is accepted.

If Ethereum is temporarily unavailable, the order is still accepted locally and the notice says:

```text
Order accepted locally. Blockchain synchronization is pending.
```

That status is not a confirmed blockchain transaction. Configure the Ethereum provider before treating it as final on-chain data.

The Super Admin can also:

- Edit medicine records.
- Change user roles.
- Reset a local user's password.
- Review the medicine and order records.

## 8. Consumer workflow

1. Sign in as **Consumer**.
2. Search by medicine name or batch number.
3. Select a medicine to view its identity details.
4. Open **Verify with QR** to scan a medicine QR code.
5. Check the medicine name, batch, manufacturer, expiry, and status.

## 9. Read the home blockchain panel

The home page displays recent transaction records.

- **Confirmed** means the configured Ethereum provider returned a successful receipt.
- **Unverified** means the record exists in the database but the provider could not verify it.
- **Local Ethereum** means a local Hardhat node is being used.
- **Ethereum sepolia** or **Ethereum mainnet** means a public Ethereum network is configured.
- The transaction list scrolls inside the blockchain panel when it becomes long.

## 10. Current demo blockchain mode

The project currently runs with `DEMO_MODE=true`. This is intentional for local testing:

- No real Ethereum RPC is called.
- No wallet private key or gas is used.
- Registration, orders, and status changes receive fake transaction hashes and block numbers.
- Those fake receipts are saved in MongoDB with each medicine record.
- The home page labels these records `Local Demo Ethereum` and `Confirmed`.

This is a database-backed simulation, not a public Ethereum transaction.

## 11. Configure real Ethereum later

Set these values in `backend/.env`:

```env
NETWORK=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=YOUR_32_BYTE_ETHEREUM_PRIVATE_KEY
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

Use an Ethereum Sepolia URL, not a Solana URL. After changing `.env`:

1. Stop the backend.
2. Start it again with `npm start`.
3. Refresh the frontend.
4. Confirm the home panel shows `Ethereum sepolia` and confirmed receipts.

Never commit `.env` or expose a private key in source control.

## 12. Troubleshooting

### The home panel says provider unavailable

Check `NETWORK`, the matching RPC URL, the contract address, and the private key format. Restart the backend after changing them.

### Accept order returns an error

The acceptance path only allows local fallback for an `InTransit` order. Confirm the selected medicine has status `InTransit`, then refresh the admin page. For confirmed blockchain acceptance, repair the Ethereum provider configuration.

### The frontend cannot reach the API

Make sure the backend is running on port 5000. The frontend uses:

```text
http://localhost:5000/api
```

### The login password seems unchanged

Refresh the page once. Existing browser accounts are migrated to `123456` when the app loads. Clear the `medchain-users` local-storage entry only if the browser contains corrupted demo data.
