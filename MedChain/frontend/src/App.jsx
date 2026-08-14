import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Interface from './Interface'
import QRCodeGenerator from './components/QRCodeGenerator'

const API_URL = 'http://localhost:5000/api'

const EMAIL_PATTERN = /^[A-Za-z][A-Za-z0-9]*\d@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem('medchain-users') || '[]')
  } catch {
    return []
  }
}

function validateEmail(email) {
  if (!email) return 'Email is required.'
  if (!email.includes('@')) return 'Enter a complete email address.'

  const localPart = email.split('@')[0]
  if (!/^[A-Za-z]/.test(localPart)) return 'Email must start with alphabets.'
  if (!/\d$/.test(localPart)) return 'Email must end with a number before @.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'

  return ''
}

function validatePassword(password) {
  return password ? '' : 'Password is required.'
}

function App() {
  const [user, setUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [authMode, setAuthMode] = useState(null)
  const [users, setUsers] = useState(getStoredUsers)

  const login = (email, password, role) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role)
    if (foundUser) setUser(foundUser)
  }

  const signup = (email, password, role) => {
    const newUser = { email, password, role, id: Date.now() }
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem('medchain-users', JSON.stringify(updatedUsers))
    setSelectedRole(role)
    setAuthMode('login')
  }

  const logout = () => {
    setUser(null)
    setSelectedRole(null)
    setAuthMode(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {user && (
        <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tight">MedChain</div>
          <span className="flex items-center gap-4">
            <span className="text-sm border border-blue-400 px-3 py-1 rounded bg-blue-700">Role: {user.role}</span>
            <button onClick={logout} className="hover:text-gray-200 underline">Logout</button>
          </span>
        </nav>
      )}
      {!user && !selectedRole && authMode !== 'signup' ? (
        <Interface
          onSelectRole={setSelectedRole}
          onSignup={() => setAuthMode('signup')}
        />
      ) : (
        <main className="flex-grow p-6 flex flex-col items-center">
          {!user ? (
            authMode === 'signup' ? (
              <Signup
                signup={signup}
                users={users}
                onBack={() => setAuthMode(null)}
              />
            ) : (
              <Login
                role={selectedRole}
                login={login}
                users={users}
                onBack={() => setSelectedRole(null)}
              />
            )
          ) : user.role === 'Manufacturer' ? (
            <ManufacturerDashboard user={user} />
          ) : user.role === 'Distributor' ? (
            <DistributorDashboard user={user} />
          ) : user.role === 'Retailer' ? (
            <RetailerDashboard user={user} />
          ) : (
            <ConsumerDashboard user={user} />
          )}
        </main>
      )}
    </div>
  )
}

function Login({ login, role, users, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const handleLogin = () => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setError(emailError || passwordError)
      return
    }

    const accountExists = users.some(user => user.email.toLowerCase() === email.toLowerCase() && user.role === role)
    if (!accountExists) {
      setError(`No ${role.toLowerCase()} account exists with this email.`)
      return
    }

    const matchingPassword = users.some(user => user.email.toLowerCase() === email.toLowerCase() && user.password === password && user.role === role)
    if (!matchingPassword) {
      setError('The password is incorrect.')
      return
    }

    setError('')
    login(email, password, role)
  }

  return (
    <div className="signup-card login-card">
      <div className="signup-card-header">
        <span className="signup-eyebrow">MedChain access</span>
        <h2>Login as {role}</h2>
        <p>Sign in to manage medicine supply chain activity.</p>
      </div>
      {error && <p className="signup-error" role="alert">{error}</p>}
      <div className="signup-form">
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" type="email" placeholder="name1@example.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
      </div>
      <button onClick={handleLogin} disabled={!email || !password} className="signup-submit">
        Sign In
      </button>
      <button onClick={onBack} className="signup-back">
        Back to role selection
      </button>
    </div>
  )
}

function Signup({ signup, users, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Manufacturer')
  const [error, setError] = useState('')

  const handleSignup = () => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setError(emailError || passwordError)
      return
    }

    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists.')
      return
    }

    signup(email, password, role)
  }

  return (
    <div className="signup-card">
      <div className="signup-card-header">
        <span className="signup-eyebrow">MedChain access</span>
        <h2>Create Account</h2>
        <p>Register a new member of the medicine supply chain.</p>
      </div>
      {error && <p className="signup-error" role="alert">{error}</p>}
      <div className="signup-form">
        <label htmlFor="signup-role">Account role</label>
        <select id="signup-role" value={role} onChange={e => setRole(e.target.value)}>
        <option>Manufacturer</option>
        <option>Distributor</option>
        <option>Retailer</option>
        <option>Consumer</option>
        </select>
        <label htmlFor="signup-email">Email address</label>
        <input id="signup-email" type="email" placeholder="name1@example.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" type="password" placeholder="Enter a secure password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
      </div>
      <button onClick={handleSignup} disabled={!email || !password} className="signup-submit">
        Create Account
      </button>
      <button onClick={onBack} className="signup-back">
        Back to role selection
      </button>
    </div>
  )
}


function ManufacturerDashboard({ user }) {
  const [name, setName] = useState('')
  const [batch, setBatch] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [chemicalComponents, setChemicalComponents] = useState('')
  const [description, setDescription] = useState('')
  const [storageConditions, setStorageConditions] = useState('')
  const [dosage, setDosage] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [createdMed, setCreatedMed] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    fetchMedicines()
  }, [])

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText)
            setScannedData(parsedData)
          } catch (e) {
            setScannedData({ data: decodedText })
          }
          setShowScanner(false)
          if (scannerRef.current) {
            scannerRef.current.clear()
            scannerRef.current = null
          }
        },
        (error) => {
          console.warn("QR scan error:", error)
        }
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [showScanner])

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      setMedicines(data)
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  const registerMedicine = async () => {
    if (!name || !batch || !expiryDate || !chemicalComponents) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    const mockBlockchainId = Math.floor(Math.random() * 1000000).toString()
    const mfgDate = manufacturingDate || new Date().toISOString().split('T')[0]
    const qrCodeData = JSON.stringify({
      id: mockBlockchainId,
      name,
      batch,
      manufacturingDate: mfgDate,
      expiryDate,
      chemicalComponents,
      description,
      storageConditions,
      dosage,
      price,
      quantity
    })

    try {
      const response = await fetch(`${API_URL}/medicines/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchainId: mockBlockchainId,
          name,
          batchNumber: batch,
          qrCodeData,
          manufacturer: user.email,
          manufacturingDate: mfgDate,
          expiryDate,
          chemicalComponents,
          description,
          storageConditions,
          dosage,
          price: price || 0,
          quantity: quantity || 0
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCreatedMed(data.medicine)
        setMedicines([...medicines, data.medicine])
        setName('')
        setBatch('')
        setManufacturingDate('')
        setExpiryDate('')
        setChemicalComponents('')
        setDescription('')
        setStorageConditions('')
        setDosage('')
        setPrice('')
        setQuantity('')
        alert('Medicine registered successfully!')
      } else {
        setError(data.error || 'Failed to register medicine')
      }
    } catch (err) {
      setError('Network error. Make sure backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-8 items-center">
    <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow border border-gray-100">
      <h3 className="text-xl font-bold mb-4 text-blue-800 border-b pb-2">Manufacturer Control Panel</h3>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="flex flex-col gap-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Medicine Name *" value={name} onChange={e=>setName(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Batch Number *" value={batch} onChange={e=>setBatch(e.target.value)} />
          <input className="border p-2 rounded" type="date" placeholder="Manufacturing Date" value={manufacturingDate} onChange={e=>setManufacturingDate(e.target.value)} />
          <input className="border p-2 rounded" type="date" placeholder="Expiry Date *" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Chemical Components *" value={chemicalComponents} onChange={e=>setChemicalComponents(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Storage Conditions" value={storageConditions} onChange={e=>setStorageConditions(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Dosage" value={dosage} onChange={e=>setDosage(e.target.value)} />
          <input className="border p-2 rounded" type="number" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
          <input className="border p-2 rounded" type="number" placeholder="Quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} />
        </div>
        <button onClick={registerMedicine} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition disabled:opacity-50">
          {loading ? 'Registering...' : 'Generate QR'}
        </button>
        <button onClick={() => setShowScanner(!showScanner)} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded font-semibold transition">
          {showScanner ? 'Close Scanner' : 'Scan QR Code'}
        </button>
      </div>

      {showScanner && (
        <div className="mt-4 w-full max-w-md">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {scannedData && (
        <div className="mt-6 w-full max-w-2xl">
          <h4 className="text-lg font-bold mb-3 text-green-700">Scanned Medicine Data</h4>
          <table className="w-full border-collapse border border-gray-300 shadow-lg">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="border p-3 text-left">Field</th>
                <th className="border p-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scannedData).map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="border p-3 font-semibold capitalize bg-gray-100">{key}</td>
                  <td className="border p-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setScannedData(null)} className="mt-2 text-sm text-red-600 hover:underline">
            Clear Data
          </button>
        </div>
      )}

      {createdMed && (
        <div className="mt-8 flex flex-col items-center bg-gray-50 p-6 rounded-lg border">
          <p className="text-lg font-bold text-gray-700 mb-4">{createdMed.name} (Batch: {createdMed.batchNumber})</p>
          <div className="bg-white p-4 shadow-sm rounded-lg">
            <QRCodeSVG value={createdMed.qrCodeData} size={200} />
          </div>
          <p className="text-sm mt-4 tracking-wider text-gray-500">ID: {createdMed.blockchainId}</p>
        </div>
      )}

      {medicines.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h4 className="text-lg font-bold mb-3">Registered Medicines</h4>
          <div className="max-h-60 overflow-y-auto border rounded">
            {medicines.map((med, index) => (
              <div key={index} className="p-3 border-b last:border-b-0">
                <p className="font-semibold">{med.name}</p>
                <p className="text-sm text-gray-500">Batch: {med.batchNumber} | ID: {med.blockchainId}</p>
                <p className="text-sm text-gray-500">Mfg: {med.manufacturingDate ? new Date(med.manufacturingDate).toLocaleDateString() : 'N/A'} | Exp: {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm text-gray-500">Qty: {med.quantity || 0} | Price: ${med.price || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    
    <div className="w-full max-w-2xl">
      <QRCodeGenerator />
    </div>
    </div>
  )
}
function DistributorDashboard({ user }) {
  const [medicines, setMedicines] = useState([])
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [orderQuantity, setOrderQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    fetchAvailableMedicines()
    fetchOrders()
    fetchInventory()
  }, [])

  const fetchAvailableMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      setMedicines(data)
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      const distributorOrders = data.filter(m => m.distributor === user.email)
      setOrders(distributorOrders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      const dist = data.filter(m => m.distributor === user.email)
      setInventory(dist)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    }
  }

  const placeOrder = async () => {
    if (!selectedMedicine || !orderQuantity) {
      alert('Please select medicine and quantity')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/medicines/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedicine._id,
          distributor: user.email,
          quantity: parseInt(orderQuantity),
          orderDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        alert('Order placed successfully!')
        setShowOrderForm(false)
        setSelectedMedicine(null)
        setOrderQuantity('')
        fetchOrders()
        fetchInventory()
      }
    } catch (err) {
      alert('Failed to place order')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-lg">
          <h2 className="text-3xl font-bold">Distributor Dashboard</h2>
          <p className="text-purple-100 mt-1">{user.email}</p>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'available' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Available Medicines
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'orders' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'inventory' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            My Inventory
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'available' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Available Medicines from Manufacturers</h3>
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                {showOrderForm ? 'Cancel' : 'Place New Order'}
              </button>

              {showOrderForm && (
                <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
                  <h4 className="font-bold mb-3">Select Medicine to Order</h4>
                  <select
                    value={selectedMedicine?._id || ''}
                    onChange={(e) => setSelectedMedicine(medicines.find(m => m._id === e.target.value))}
                    className="w-full border p-2 rounded mb-3"
                  >
                    <option value="">-- Select Medicine --</option>
                    {medicines.map(med => (
                      <option key={med._id} value={med._id}>
                        {med.name} (Batch: {med.batchNumber}) - ${med.price}/unit
                      </option>
                    ))}
                  </select>

                  {selectedMedicine && (
                    <div className="bg-white p-3 rounded mb-3 border">
                      <p className="text-sm"><strong>Name:</strong> {selectedMedicine.name}</p>
                      <p className="text-sm"><strong>Manufacturer:</strong> {selectedMedicine.manufacturer}</p>
                      <p className="text-sm"><strong>Expiry:</strong> {new Date(selectedMedicine.expiryDate).toLocaleDateString()}</p>
                      <p className="text-sm"><strong>Available:</strong> {selectedMedicine.quantity}</p>
                    </div>
                  )}

                  <input
                    type="number"
                    placeholder="Quantity"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="w-full border p-2 rounded mb-3"
                    min="1"
                  />

                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Order'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.map(med => (
                  <div key={med._id} className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow">
                    <h4 className="font-bold text-purple-900">{med.name}</h4>
                    <p className="text-sm text-purple-700">Batch: {med.batchNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Manufacturer: {med.manufacturer}</p>
                    <p className="text-sm text-gray-600">Expiry: {new Date(med.expiryDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Available: {med.quantity} units</p>
                    <p className="text-lg font-bold text-purple-700 mt-2">${med.price}/unit</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">My Orders</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders placed yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-blue-900">{order.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {order.quantity || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Status: <span className="font-semibold text-blue-600">In Transit</span></p>
                        </div>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">My Inventory</h3>
              {inventory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No inventory items</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-purple-600 text-white">
                        <th className="border p-3 text-left">Medicine</th>
                        <th className="border p-3 text-left">Batch</th>
                        <th className="border p-3 text-center">Quantity</th>
                        <th className="border p-3 text-left">Expiry</th>
                        <th className="border p-3 text-center">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border p-3 font-semibold">{item.name}</td>
                          <td className="border p-3">{item.batchNumber}</td>
                          <td className="border p-3 text-center">{item.quantity}</td>
                          <td className="border p-3">{new Date(item.expiryDate).toLocaleDateString()}</td>
                          <td className="border p-3 text-center">${item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RetailerDashboard({ user }) {
  const [medicines, setMedicines] = useState([])
  const [orders, setOrders] = useState([])
  const [storeInventory, setStoreInventory] = useState([])
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [orderQuantity, setOrderQuantity] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('store')
  const scannerRef = useRef(null)

  useEffect(() => {
    fetchMedicines()
    fetchOrders()
    fetchStoreInventory()
  }, [])

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader-retailer",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText)
            setScannedData(parsedData)
          } catch (e) {
            setScannedData({ data: decodedText })
          }
          setShowScanner(false)
          if (scannerRef.current) {
            scannerRef.current.clear()
            scannerRef.current = null
          }
        },
        (error) => console.warn("QR scan error:", error)
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [showScanner])

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      setMedicines(data.filter(m => m.quantity > 0))
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      const retailerOrders = data.filter(m => m.retailer === user.email)
      setOrders(retailerOrders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const fetchStoreInventory = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      const storeItems = data.filter(m => m.retailer === user.email)
      setStoreInventory(storeItems)
    } catch (err) {
      console.error('Failed to fetch store inventory:', err)
    }
  }

  const placeOrder = async () => {
    if (!selectedMedicine || !orderQuantity) {
      alert('Please select medicine and quantity')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/medicines/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedicine._id,
          retailer: user.email,
          quantity: parseInt(orderQuantity),
          orderDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        alert('Order placed with distributor!')
        setShowOrderForm(false)
        setSelectedMedicine(null)
        setOrderQuantity('')
        fetchOrders()
        fetchStoreInventory()
      }
    } catch (err) {
      alert('Failed to place order')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-lg">
          <h2 className="text-3xl font-bold">Retailer Dashboard</h2>
          <p className="text-green-100 mt-1">{user.email}</p>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'store' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Store Inventory
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'available' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Available Medicines
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'orders' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'verify' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Verify QR
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'store' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">My Store Inventory</h3>
              {storeInventory.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No medicines in stock</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    Place Order Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="border p-3 text-left">Medicine</th>
                        <th className="border p-3 text-left">Batch</th>
                        <th className="border p-3 text-center">Stock</th>
                        <th className="border p-3 text-left">Expiry</th>
                        <th className="border p-3 text-center">Sell Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeInventory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border p-3 font-semibold">{item.name}</td>
                          <td className="border p-3">{item.batchNumber}</td>
                          <td className="border p-3 text-center font-bold text-green-600">{item.quantity}</td>
                          <td className="border p-3">{new Date(item.expiryDate).toLocaleDateString()}</td>
                          <td className="border p-3 text-center">${(item.price * 1.3).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Available from Distributors</h3>
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                {showOrderForm ? 'Cancel' : 'Place New Order'}
              </button>

              {showOrderForm && (
                <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
                  <h4 className="font-bold mb-3">Select Medicine to Order</h4>
                  <select
                    value={selectedMedicine?._id || ''}
                    onChange={(e) => setSelectedMedicine(medicines.find(m => m._id === e.target.value))}
                    className="w-full border p-2 rounded mb-3"
                  >
                    <option value="">-- Select Medicine --</option>
                    {medicines.map(med => (
                      <option key={med._id} value={med._id}>
                        {med.name} - ${med.price}/unit
                      </option>
                    ))}
                  </select>

                  {selectedMedicine && (
                    <div className="bg-white p-3 rounded mb-3 border">
                      <p className="text-sm"><strong>Name:</strong> {selectedMedicine.name}</p>
                      <p className="text-sm"><strong>Manufacturer:</strong> {selectedMedicine.manufacturer}</p>
                      <p className="text-sm"><strong>Expiry:</strong> {new Date(selectedMedicine.expiryDate).toLocaleDateString()}</p>
                      <p className="text-sm"><strong>Available:</strong> {selectedMedicine.quantity}</p>
                    </div>
                  )}

                  <input
                    type="number"
                    placeholder="Quantity"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="w-full border p-2 rounded mb-3"
                    min="1"
                  />

                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Order'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.map(med => (
                  <div key={med._id} className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow">
                    <h4 className="font-bold text-green-900">{med.name}</h4>
                    <p className="text-sm text-green-700">Batch: {med.batchNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Manufacturer: {med.manufacturer}</p>
                    <p className="text-sm text-gray-600">Expiry: {new Date(med.expiryDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Available: {med.quantity} units</p>
                    <p className="text-lg font-bold text-green-700 mt-2">${med.price}/unit</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">My Orders</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders placed yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-blue-900">{order.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {order.quantity || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Status: <span className="font-semibold text-blue-600">Pending Delivery</span></p>
                        </div>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">In Progress</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'verify' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Verify Medicine Authenticity</h3>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                {showScanner ? 'Close Scanner' : 'Scan QR Code'}
              </button>

              {showScanner && (
                <div className="mt-4 w-full max-w-md mb-4">
                  <div id="qr-reader-retailer" className="w-full"></div>
                </div>
              )}

              {scannedData && (
                <div>
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-bold text-green-700 mb-3">✓ Medicine Verified Authentic</h4>
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        {Object.entries(scannedData).map(([key, value]) => (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="border p-2 font-semibold capitalize bg-gray-100">{key}</td>
                            <td className="border p-2">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => setScannedData(null)}
                    className="text-red-600 hover:underline"
                  >
                    Scan Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsumerDashboard({ user }) {
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [activeTab, setActiveTab] = useState('search')
  const scannerRef = useRef(null)

  useEffect(() => {
    fetchMedicines()
  }, [])

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader-consumer",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText)
            setScannedData(parsedData)
            setShowScanner(false)
            if (scannerRef.current) {
              scannerRef.current.clear()
              scannerRef.current = null
            }
          } catch (e) {
            console.warn('Invalid QR code format')
          }
        },
        (error) => console.warn("QR scan error:", error)
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [showScanner])

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/medicines`)
      const data = await response.json()
      setMedicines(data)
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date()
  const daysToExpiry = (expiryDate) => Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <h2 className="text-3xl font-bold">Consumer Dashboard</h2>
          <p className="text-blue-100 mt-1">{user.email}</p>
          <p className="text-blue-100 text-sm mt-2">Search medicines and verify authenticity</p>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'search' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Search Medicines
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 p-4 text-center font-semibold transition ${activeTab === 'verify' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Verify with QR
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'search' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Search Medicines</h3>
              <input
                type="text"
                placeholder="Search by medicine name or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-blue-300 p-3 rounded-lg mb-4 focus:outline-none focus:border-blue-600 transition"
              />

              {filteredMedicines.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No medicines found</p>
              ) : (
                <div className="space-y-4">
                  {filteredMedicines.map(med => {
                    const expired = isExpired(med.expiryDate)
                    const daysLeft = daysToExpiry(med.expiryDate)
                    return (
                      <div
                        key={med._id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition transform hover:scale-105 ${
                          expired ? 'border-red-400 bg-red-50' : daysLeft < 30 ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'
                        }`}
                        onClick={() => setSelectedMedicine(med)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{med.name}</h4>
                            <p className="text-sm text-gray-600">Batch: {med.batchNumber} | ID: {med.blockchainId}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            expired ? 'bg-red-600 text-white' : daysLeft < 30 ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                          }`}>
                            {expired ? 'EXPIRED' : `${daysLeft}d`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Manufacturer: <strong>{med.manufacturer}</strong></p>
                        <p className="text-sm text-gray-600 mb-1">Chemical: {med.chemicalComponents}</p>
                        <p className="text-sm text-gray-600">Mfg Date: {new Date(med.manufacturingDate).toLocaleDateString()} | Exp: {new Date(med.expiryDate).toLocaleDateString()}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'verify' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Verify Medicine with QR Code</h3>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                {showScanner ? 'Close Scanner' : 'Scan QR Code'}
              </button>

              {showScanner && (
                <div className="mt-4 w-full max-w-md mb-4 border-2 border-blue-400 rounded-lg overflow-hidden">
                  <div id="qr-reader-consumer" className="w-full"></div>
                </div>
              )}

              {scannedData && (
                <div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border-3 border-green-500 rounded-lg p-6 mb-4 shadow-lg">
                    <h4 className="text-2xl font-bold text-green-700 mb-4">✓ AUTHENTIC MEDICINE VERIFIED</h4>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <table className="w-full">
                        <tbody>
                          {Object.entries(scannedData).map(([key, value]) => (
                            <tr key={key} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="p-3 font-semibold text-blue-700 capitalize">{key}</td>
                              <td className="p-3 text-gray-800">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button
                    onClick={() => setScannedData(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
                  >
                    Scan Another Medicine
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedMedicine && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedMedicine.name}</h3>
                  <button
                    onClick={() => setSelectedMedicine(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3">Medicine Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Batch Number:</strong> {selectedMedicine.batchNumber}</p>
                      <p><strong>Blockchain ID:</strong> {selectedMedicine.blockchainId}</p>
                      <p><strong>Manufacturer:</strong> {selectedMedicine.manufacturer}</p>
                      <p><strong>Chemical Components:</strong> {selectedMedicine.chemicalComponents}</p>
                      <p><strong>Dosage:</strong> {selectedMedicine.dosage || 'N/A'}</p>
                      <p><strong>Description:</strong> {selectedMedicine.description || 'N/A'}</p>
                      <p><strong>Storage Conditions:</strong> {selectedMedicine.storageConditions || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-700 mb-3">Date & Price Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Manufacturing Date:</strong> {new Date(selectedMedicine.manufacturingDate).toLocaleDateString()}</p>
                      <p><strong>Expiry Date:</strong> {new Date(selectedMedicine.expiryDate).toLocaleDateString()}</p>
                      <p><strong>Days Until Expiry:</strong> <span className="font-bold text-blue-600">{daysToExpiry(selectedMedicine.expiryDate)} days</span></p>
                      <p><strong>Price:</strong> ${selectedMedicine.price}</p>
                      <p><strong>Available Quantity:</strong> {selectedMedicine.quantity} units</p>
                    </div>

                    {isExpired(selectedMedicine.expiryDate) && (
                      <div className="mt-4 bg-red-100 border-2 border-red-500 rounded p-3 text-red-700 font-bold text-center">
                        ⚠ This medicine has expired!
                      </div>
                    )}
                    {!isExpired(selectedMedicine.expiryDate) && daysToExpiry(selectedMedicine.expiryDate) < 30 && (
                      <div className="mt-4 bg-yellow-100 border-2 border-yellow-500 rounded p-3 text-yellow-700 font-bold text-center">
                        ⚠ Expiring soon ({daysToExpiry(selectedMedicine.expiryDate)} days)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMedicine(null)}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
