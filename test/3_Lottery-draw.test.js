const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Drawing a winner", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = new BN("3");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

  const expectedPlatformFee = new BN("15000000000000000");
  const expectedLotteryOwnerFee = new BN("7500000000000000");
  const expectedWinnings = new BN("2977500000000000000");

  const BN_ZERO = new BN("0");

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

  it("should draw a winner", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    const result = await this.lottery.drawWinner({ from: lotteryOwner });
    expectEvent(result, "Winner");
  });

  it("should not draw a winner if there are tickets left to be sold", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });

    await expectRevert(
      this.lottery.drawWinner({ from: lotteryOwner }),
      "Not enough entries to draw the winner!"
    );
  });

  it("should set the winnings for withdrawal", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    const result = await this.lottery.drawWinner({ from: lotteryOwner });
    const winner = result.logs[0].args.winner;
    const winnings = await this.lottery.pendingWithdrawals(winner);
    expect(winnings).to.be.bignumber.equal(expectedWinnings);
  });

  it("should set the lottery owner fee for withdrawal", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    await this.lottery.drawWinner({ from: lotteryOwner });
    const lotteryOwnerFee = await this.lottery.pendingWithdrawals(lotteryOwner);
    expect(lotteryOwnerFee).to.be.bignumber.equal(expectedLotteryOwnerFee);
  });

  it("should set the platform owner fee for withdrawal", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    await this.lottery.drawWinner({ from: lotteryOwner });
    const platformOwnerFee = await this.lottery.pendingWithdrawals(
      platformAdmin
    );
    expect(platformOwnerFee).to.be.bignumber.equal(expectedPlatformFee);
  });

  it("should set the pool to zero", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    await this.lottery.drawWinner({ from: lotteryOwner });
    const result = await this.lottery.pool();
    expect(result).to.be.bignumber.equal(BN_ZERO);
  });

  it("should set the drawn flag to true", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    await this.lottery.drawWinner({ from: lotteryOwner });

    const result = await this.lottery.drawn();
    expect(result).to.equal(true);
  });
});
