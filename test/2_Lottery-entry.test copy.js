const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Entering the lottery", function () {
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

  it("should allow a player to enter", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = await this.lottery.players(player1);
    expect(result).to.equal(true);
  });

  it("should not allow more than one entry per address", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await expectRevert(
      this.lottery.enter({ value: entryFee, from: player1 }),
      "Address already entered!"
    );
  });

  it("should not allow an incorrect entry fee", async () => {
    const greaterEntryFee = new BN("1000000000000000001");
    await expectRevert(
      this.lottery.enter({ value: greaterEntryFee, from: player1 }),
      "The entry fee is incorrect!"
    );
    const lesserEntryFee = new BN("999999999999999999");
    await expectRevert(
      this.lottery.enter({ value: lesserEntryFee, from: player1 }),
      "The entry fee is incorrect!"
    );
  });

  it("should emit the Entered event", async () => {
    const result = await this.lottery.enter({ value: entryFee, from: player1 });
    expectEvent(result, "Entered", { player: player1 });
  });

  it("should not allow more entries than the maximum", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    await this.lottery.enter({ value: entryFee, from: player2 });
    await expectRevert(
      this.lottery.enter({ value: entryFee, from: player3 }),
      "Maximum entries: no further entries allowed!"
    );
  });

  it("should increase the number of entries when a player enters", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = await this.lottery.entryCount();
    expect(result).to.be.bignumber.equal(new BN("1"));
  });

  it("should increase the prize pool when a player enters", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = await this.lottery.pool();
    expect(result).to.be.bignumber.equal(entryFee);
  });

  it("should add the player's address to the entries array", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = await this.lottery.entries(0);
    expect(result).to.equal(player1);
  });
});
