const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("End-to-End", function () {
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

  it("should work end-to-end", async () => {
    this.lottery = await Lottery.new(
      platformAdmin,
      lotteryOwner,
      maxEntries,
      entryFee,
      lotteryFee,
      platformFee
    );

    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await this.lottery.enter({ value: entryFee, from: player3 });

    const result = await this.lottery.drawWinner({ from: lotteryOwner });
    expectEvent(result, "Winner");
    const winner = result.logs[0].args.winner;

    const winnerReceipt = await this.lottery.withdraw({ from: winner });
    expectEvent(winnerReceipt, "FundsWithdrawn", {
      payee: winner,
      amount: expectedWinnings,
    });

    const lotteryOwnerReceipt = await this.lottery.withdraw({
      from: lotteryOwner,
    });
    expectEvent(lotteryOwnerReceipt, "FundsWithdrawn", {
      payee: lotteryOwner,
      amount: expectedLotteryOwnerFee,
    });

    const platformAdminReceipt = await this.lottery.withdraw({
      from: platformAdmin,
    });
    expectEvent(platformAdminReceipt, "FundsWithdrawn", {
      payee: platformAdmin,
      amount: expectedPlatformFee,
    });

    const balance = await this.lottery.checkBalance({ from: platformAdmin });
    expect(balance).to.be.bignumber.equal(BN_ZERO);
  });
});
