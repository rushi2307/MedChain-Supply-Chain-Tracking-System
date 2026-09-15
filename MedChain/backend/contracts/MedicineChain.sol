// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedicineChain {
    struct Medicine {
        string name;
        string manufacturer;
        uint256 manufacturingDate;
        uint256 expiryDate;
        string batchNumber;
        string currentLocation;
        address currentOwner;
        MedicineStatus status;
        bool isRegistered;
    }

    struct SupplyChainEvent {
        string action;
        string location;
        string description;
        uint256 timestamp;
        address actor;
    }

    enum MedicineStatus {
        Manufactured,
        InTransit,
        Stored,
        Sold,
        Expired,
        Recalled
    }

    mapping(string => Medicine) public medicines;
    mapping(string => SupplyChainEvent[]) public medicineHistory;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedDistributors;
    mapping(string => address) public medicineOwners;

    uint256 public medicineCount;
    address public owner;

    event MedicineRegistered(
        string indexed batchNumber,
        string name,
        address indexed manufacturer,
        uint256 timestamp
    );
    event MedicineTransferred(
        string indexed batchNumber,
        address indexed from,
        address indexed to,
        string newLocation,
        uint256 timestamp
    );
    event StatusChanged(
        string indexed batchNumber,
        MedicineStatus oldStatus,
        MedicineStatus newStatus,
        uint256 timestamp
    );
    event SupplyChainEventAdded(
        string indexed batchNumber,
        string action,
        uint256 timestamp
    );
    event AuthorizationChanged(
        address indexed account,
        string role,
        bool authorized,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturers[msg.sender], "Not an authorized manufacturer");
        _;
    }

    modifier onlyAuthorizedDistributor() {
        require(authorizedDistributors[msg.sender], "Not an authorized distributor");
        _;
    }

    modifier medicineExists(string memory batchNumber) {
        require(medicines[batchNumber].isRegistered, "Medicine not registered");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedManufacturers[owner] = true;
        authorizedDistributors[owner] = true;
    }

    function registerMedicine(
        string memory name,
        string memory manufacturer,
        uint256 manufacturingDate,
        uint256 expiryDate,
        string memory batchNumber,
        string memory initialLocation
    ) public onlyAuthorizedManufacturer {
        require(!medicines[batchNumber].isRegistered, "Medicine already registered");
        require(manufacturingDate < expiryDate, "Invalid dates");
        require(bytes(name).length > 0, "Name required");
        require(bytes(batchNumber).length > 0, "Batch number required");

        medicines[batchNumber] = Medicine({
            name: name,
            manufacturer: manufacturer,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            batchNumber: batchNumber,
            currentLocation: initialLocation,
            currentOwner: msg.sender,
            status: MedicineStatus.Manufactured,
            isRegistered: true
        });

        medicineOwners[batchNumber] = msg.sender;
        medicineCount++;

        medicineHistory[batchNumber].push(SupplyChainEvent({
            action: "MANUFACTURED",
            location: initialLocation,
            description: "Medicine manufactured",
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit MedicineRegistered(batchNumber, name, msg.sender, block.timestamp);
    }

    function transferMedicine(
        string memory batchNumber,
        address newOwner,
        string memory newLocation
    ) public medicineExists(batchNumber) {
        Medicine storage medicine = medicines[batchNumber];

        require(
            msg.sender == medicine.currentOwner ||
            authorizedDistributors[msg.sender],
            "Not authorized to transfer"
        );
        require(newOwner != address(0), "Invalid address");

        address oldOwner = medicine.currentOwner;
        medicine.currentOwner = newOwner;
        medicine.currentLocation = newLocation;
        medicineOwners[batchNumber] = newOwner;

        medicineHistory[batchNumber].push(SupplyChainEvent({
            action: "TRANSFERRED",
            location: newLocation,
            description: "Medicine ownership transferred",
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit MedicineTransferred(batchNumber, oldOwner, newOwner, newLocation, block.timestamp);
    }

    function updateStatus(string memory batchNumber, MedicineStatus newStatus)
        public
        medicineExists(batchNumber)
    {
        Medicine storage medicine = medicines[batchNumber];
        require(
            msg.sender == medicine.currentOwner ||
            authorizedDistributors[msg.sender] ||
            msg.sender == owner,
            "Not authorized to update status"
        );

        MedicineStatus oldStatus = medicine.status;
        medicine.status = newStatus;

        medicineHistory[batchNumber].push(SupplyChainEvent({
            action: _statusToString(newStatus),
            location: medicine.currentLocation,
            description: "Status updated",
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit StatusChanged(batchNumber, oldStatus, newStatus, block.timestamp);
    }

    function recordSupplyChainEvent(
        string memory batchNumber,
        string memory action,
        string memory location,
        string memory description
    ) public medicineExists(batchNumber) {
        Medicine storage medicine = medicines[batchNumber];
        require(
            msg.sender == medicine.currentOwner ||
            authorizedDistributors[msg.sender] ||
            msg.sender == owner,
            "Not authorized to record events"
        );

        medicineHistory[batchNumber].push(SupplyChainEvent({
            action: action,
            location: location,
            description: description,
            timestamp: block.timestamp,
            actor: msg.sender
        }));

        emit SupplyChainEventAdded(batchNumber, action, block.timestamp);
    }

    function getMedicine(string memory batchNumber)
        public
        view
        medicineExists(batchNumber)
        returns (
            string memory name,
            string memory manufacturer,
            uint256 manufacturingDate,
            uint256 expiryDate,
            string memory currentLocation,
            address currentOwner,
            MedicineStatus status
        )
    {
        Medicine memory medicine = medicines[batchNumber];
        return (
            medicine.name,
            medicine.manufacturer,
            medicine.manufacturingDate,
            medicine.expiryDate,
            medicine.currentLocation,
            medicine.currentOwner,
            medicine.status
        );
    }

    function getHistoryLength(string memory batchNumber)
        public
        view
        returns (uint256)
    {
        return medicineHistory[batchNumber].length;
    }

    function getSupplyChainEvent(string memory batchNumber, uint256 index)
        public
        view
        returns (
            string memory action,
            string memory location,
            string memory description,
            uint256 timestamp,
            address actor
        )
    {
        require(index < medicineHistory[batchNumber].length, "Invalid index");
        SupplyChainEvent memory event_ = medicineHistory[batchNumber][index];
        return (
            event_.action,
            event_.location,
            event_.description,
            event_.timestamp,
            event_.actor
        );
    }

    function isExpired(string memory batchNumber)
        public
        view
        returns (bool)
    {
        Medicine memory medicine = medicines[batchNumber];
        return block.timestamp > medicine.expiryDate;
    }

    function authorizeManufacturer(address account, bool authorized)
        public
        onlyOwner
    {
        authorizedManufacturers[account] = authorized;
        emit AuthorizationChanged(account, "MANUFACTURER", authorized, block.timestamp);
    }

    function authorizeDistributor(address account, bool authorized)
        public
        onlyOwner
    {
        authorizedDistributors[account] = authorized;
        emit AuthorizationChanged(account, "DISTRIBUTOR", authorized, block.timestamp);
    }

    function _statusToString(MedicineStatus status)
        internal
        pure
        returns (string memory)
    {
        if (status == MedicineStatus.Manufactured) return "MANUFACTURED";
        if (status == MedicineStatus.InTransit) return "IN_TRANSIT";
        if (status == MedicineStatus.Stored) return "STORED";
        if (status == MedicineStatus.Sold) return "SOLD";
        if (status == MedicineStatus.Expired) return "EXPIRED";
        if (status == MedicineStatus.Recalled) return "RECALLED";
        return "UNKNOWN";
    }
}