const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Withrdawing funds", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = new BN("3");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  const expectedPlatformFee = new BN("15000000000000000");
  const expectedLotteryOwnerFee = new BN("7500000000000000");
  const expectedWinnings = new BN("2977500000000000000");

  const ZERO = new BN("0");

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

  it("should allow the winnings to be withdrawn", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    const result = await this.lottery.drawWinner({ from: lotteryOwner });
    const winner = result.logs[0].args.winner;

    const receipt = await this.lottery.withdraw({ from: winner });
    expectEvent(receipt, "FundsWithdrawn", {
      payee: winner,
      amount: expectedWinnings,
    });
  });

  it("should allow the lottery owner to withdaw fees", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });
    const result = await this.lottery.drawWinner({ from: lotteryOwner });

    const receipt = await this.lottery.withdraw({ from: lotteryOwner });
    expectEvent(receipt, "FundsWithdrawn", {
      payee: lotteryOwner,
      amount: expectedLotteryOwnerFee,
    });
  });

  it("should allow the platform owner to withdraw fees", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });
    const result = await this.lottery.drawWinner({ from: lotteryOwner });

    const receipt = await this.lottery.withdraw({ from: platformAdmin });
    expectEvent(receipt, "FundsWithdrawn", {
      payee: platformAdmin,
      amount: expectedPlatformFee,
    });
  });

  it("should not allow more than one withdrawal", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });
    const result = await this.lottery.drawWinner({ from: lotteryOwner });

    await this.lottery.withdraw({ from: lotteryOwner });
    await expectRevert(
      this.lottery.withdraw({ from: lotteryOwner }),
      "No funds to withdraw!"
    );
  });

  it("should have a zero balance", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });
    const result = await this.lottery.drawWinner({ from: lotteryOwner });

    const winner = result.logs[0].args.winner;
    await this.lottery.withdraw({ from: winner });
    await this.lottery.withdraw({ from: lotteryOwner });
    await this.lottery.withdraw({ from: platformAdmin });

    const balance = await this.lottery.checkBalance({ from: platformAdmin });
    expect(balance).to.be.bignumber.equal(ZERO);
  });
});
