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
  const maxEntries = new BN("2");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  beforeEach(async () => {
    this.lottery = await Lottery.new(
      platformAdmin,
      lotteryOwner,
      maxEntries,
      entryFee,
      lotteryFee,
      platformFee
    );
  });

  it("should not allow an unauthorised account to draw a winner", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });

    await expectRevert(
      this.lottery.drawWinner({ from: player3 }),
      "You are not authorized to draw a winner!"
    );
  });

  it("should not allow an unauthorized account to check the contract balance", async () => {
    await expectRevert(
      this.lottery.checkBalance({ from: player3 }),
      "You are not authorised!"
    );
  });

  it("should not allow an unauthorized account to withdraw a contract balance", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.drawWinner({ from: lotteryOwner });

    await expectRevert(
      this.lottery.withdrawBalance({ from: player3 }),
      "You are not authorised!"
    );
  });

  it("should not allow an unauthorized account to pause the contract", async () => {
    await expectRevert(
      this.lottery.pause({ from: player3 }),
      "You are not authorized to take this action!"
    );
  });

  it("should not allow an unauthorized account to unpause the contract", async () => {
    await this.lottery.pause({ from: lotteryOwner });
    await expectRevert(
      this.lottery.unpause({ from: player3 }),
      "You are not authorized to take this action!"
    );
  });
});

describe("Pausing the contract", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = new BN("3");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  beforeEach(async () => {
    this.lottery = await Lottery.new(
      platformAdmin,
      lotteryOwner,
      maxEntries,
      entryFee,
      lotteryFee,
      platformFee
    );
  });

  it("should allow the contract to be paused", async () => {
    let result = await this.lottery.pause({ from: lotteryOwner });
    expectEvent(result, "ContractPaused", { pausedBy: lotteryOwner });
    await this.lottery.unpause({ from: lotteryOwner });
    result = await this.lottery.pause({ from: platformAdmin });
    expectEvent(result, "ContractPaused", { pausedBy: platformAdmin });
  });

  xit("should allow the contract to be unpaused", async () => {});

  xit("should not allow an entry while paused", async () => {});

  xit("should not allow a winner to be drawn while paused", async () => {});

  xit("should not allow withdrawals while paused", () => {});
});
