const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Access Control", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = new BN("3");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  const ZERO = new BN("0");

  xit("should only allow the lottery owner and platform admin to draw a winner", async () => {});

  xit("should only allow the platform admin to check the contract balance", async () => {});

  xit("should only allow the platform admin withdraw a contract balance", async () => {});

  xit("should only allow the lottery owner or platform admin pause the contract", async () => {});

  xit("should only allow the lottery owner or platform admin unpause the contract", async () => {});
});

describe("Pausing the contract", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = new BN("3");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  const ZERO = new BN("0");

  xit("should allow the contract to be paused", async () => {});

  xit("should allow the contract to be unpaused", async () => {});

  xit("should not allow withdrawals while paused", () => {});

  xit("should not allow a winner to be drawn while paused", async () => {});

  xit("should not allow an entry while paused", async () => {});
});
