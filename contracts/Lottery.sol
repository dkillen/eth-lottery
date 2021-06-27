// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @notice This contract allows players to enter and the lottery
 * owner to draw once all entries are sold. Only one entry per address.
 * @dev It is intended that an instance of this contract will be deployed 
 * by a factory contract
 */
contract Lottery is Pausable, AccessControl, ReentrancyGuard {

    /// @dev AccessControl roles
    bytes32 public constant LOTTERY_OWNER_ROLE = keccak256("LOTTERY_OWNER_ROLE");
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");    

    /// @dev Platform administrator.
    address payable public platformAdmin;
   
    /// @dev Lottery owner.
    address payable public lotteryOwner;
   
    /// @dev The amount to be paid for a single entry (in wei).
    uint256 public entryFee;

    /// @dev The total of the lottery pool (in wei).
    uint256 public pool;

    /// @dev The number of entries required before the lottery can be drawn.
    uint64 public maxEntries;
   
    /// @dev The number of entries.
    uint64 public entryCount;

    /**
     * @dev To calculate the fees for the lottery owner and the platform.
     * E.g. 
     * a value of 200 equates to 0.5%
     * a value of 400 equates to 0.25%
     */
    uint64 public lotteryFee;   
    uint64 public platformFee;
   
    /// @dev Has the lottery been drawn?
    bool public drawn;
   
    /// @dev The players - used to check whether an address has entered.
    mapping(address => bool) public players;
   
    /// @dev An array of the addresses entered.
    address[] public entries;
   
    /// @dev Mapping to aid tracking pending withdrawals
    mapping(address => uint) private pendingWithdrawals;
   
    /**
     * @dev Emitted when an entry is submitted.
     * `player` is the address that submitted an entry.
     */
    event Entered(address player);
   
    /**
     * @dev Emitted when a lottery winner is selected.
     * `winner` is the winning address.
     * `winnings` is the amount won by the winner.
     */ 
    event Winner(address winner, uint winnings);
   
    /**
     * @dev Emitted if eth recieved by receiver function.
     * `sender` The address eth received from.
     * `value` is The amount of eth reveived.
     */
    event Received(address sender, uint value);
   
    /**
     * @dev Emitted when contract is paused.
     * `pausedBy` is the address that paused the contract.
     */
    event ContractPaused(address pausedBy);

    /**
     * @dev Emitted when funds are withdrawn from the contract.
     * `payee` is the address withdrawing funds.
     * `amount` is the amount of funds withdrawn by the payee.
     */
    event FundsWithdrawn(address payee, uint amount);

    /**
     * @dev If an address has already entered, reject it. Only one entry per address.
     */ 
    modifier oneEntryPerAddress {
       require(!players[msg.sender], "Address already entered!");
       _;
    }
   
    /**
     * @notice Lottery contract constructor.
     * @param _platformAdmin The address of the lottery platform administrator.
     * @param _lotteryOwner The address of the lottery owner (owner of the lottery).
     * @param _maxEntries The number of entries required before the lottery can be drawn.
     * @param _entryFee The required deposit (in wei) for each entry into the lottery.
     * @param _lotteryFee Used to calculate the lottery owner's fee.
     * @param _platformFee Udes to calculate the lottery platform fee.
     */
    constructor(
        address payable _platformAdmin, 
        address payable _lotteryOwner, 
        uint64 _maxEntries, 
        uint256 _entryFee, 
        uint64 _lotteryFee, 
        uint64 _platformFee 
    ) {
        platformAdmin = _platformAdmin;
        _setupRole(PLATFORM_ADMIN_ROLE, platformAdmin);

        lotteryOwner = _lotteryOwner;
        _setupRole(LOTTERY_OWNER_ROLE, lotteryOwner);

        maxEntries = _maxEntries;
        entryFee = _entryFee;
        lotteryFee = _lotteryFee;
        platformFee = _platformFee;

        entryCount = 0;
        pool = 0;
        drawn = false;
   }
   
    /**
     * @notice Allow a player to enter the lottery.
     * @dev Only one entry allowed per address.
     */
    function enter() public payable oneEntryPerAddress whenNotPaused {
        require(
            msg.value == entryFee,
            "The entry fee is incorrect!"
        );
        require(entryCount < maxEntries, "Maximum entries: no further entries allowed!");

        entries.push(msg.sender);
        players[msg.sender] = true;
        pool = pool + msg.value;
        entryCount++;

        emit Entered(msg.sender);
   }
   
   /**
    * @notice Allow administrators to draw the lottery once all entries are complete
    * @dev 
    */
    function drawWinner() public whenNotPaused {
        require(
            hasRole(LOTTERY_OWNER_ROLE, msg.sender) || hasRole(PLATFORM_ADMIN_ROLE, msg.sender), 
            "Cannot draw the winner!"
        );

        require(entryCount >= maxEntries, "Not enough entries to draw the winner!");
       
        // Temporary - winner address
        address winner = 0xdD870fA1b7C4700F2BD7f44238821C26f7392148;
       
        // Lottery owner's fee
        uint lotteryFeeTotal = pool / lotteryFee;
        pendingWithdrawals[lotteryOwner] = lotteryFeeTotal;
        pool = pool - lotteryFeeTotal;
       
        // Platform fee
        uint platformFeeTotal = pool / platformFee;
        pendingWithdrawals[platformAdmin] = platformFeeTotal;
        pool = pool - platformFeeTotal;
       
        // Winnings
        uint winnings = pool - (pendingWithdrawals[lotteryOwner] + pendingWithdrawals[platformAdmin]);
        pendingWithdrawals[winner] = winnings;
        pool = pool - winnings;
       
        drawn = true;
        emit Winner(winner, winnings);
   }
   
    /**
     * @notice Withdraw of funds from the contract.
     * @dev It is anticipated that this function will be called by the lottery owner, 
     * platform administrator or a lottery winner
     */
    function withdraw() public whenNotPaused nonReentrant {
        require(
            pendingWithdrawals[msg.sender] > 0,
            "No funds to withdraw!"
        );

        uint amount = pendingWithdrawals[msg.sender];
        pendingWithdrawals[msg.sender] = 0;
     
        // payable(msg.sender).transfer(amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed!");

        emit FundsWithdrawn(msg.sender, amount);
    }
   
    /**
     * @dev Withdraw the contract balance. This should only be called by the platform 
     * administrator once the lottery is drawn.
     */
    function withdrawBalance() public nonReentrant {
        require(
            hasRole(PLATFORM_ADMIN_ROLE,msg.sender), 
            "You are not authorised!"
        );
        require(drawn == true, "The lottery has not been drawn!");

        uint amount = address(this).balance;
        payable(msg.sender).transfer(amount);
    }
   
    /**
     * @dev Check the balance on the contract
     */
    function checkBalance() public view returns (uint) {
        require(
            hasRole(PLATFORM_ADMIN_ROLE, msg.sender),
            "You are not authorised!"
        );

        return address(this).balance;
    }

    /**
     * @dev Call _pause function inherited from Pausable to pause the contract
     */
    function pause() public whenNotPaused {
        require(
            hasRole(LOTTERY_OWNER_ROLE, msg.sender) || hasRole(PLATFORM_ADMIN_ROLE, msg.sender),
            "You are not authorised to take this action"
        );

        _pause();
    }

    /**
     * @dev Call _unpause() inherited from Pausable to unpause the contract
     */
    function unpause() public whenPaused {
        require(
            hasRole(LOTTERY_OWNER_ROLE, msg.sender) || hasRole(PLATFORM_ADMIN_ROLE, msg.sender),
            "You are not authorised to take this action"
        );

        _unpause();
    }
   
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
