const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const { expect } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Deploying the lottery contract", () => {
  const [platformAdmin, lotteryOwner] = accounts;
  const maxEntries = 2;
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = 400;
  const platformFee = 200;

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

  it("should set the platform administrator", async () => {
    const result = await this.lottery.platformAdmin();
    expect(result).to.equal(platformAdmin);
  });

  it("should set the lottery owner", async () => {
    const result = await this.lottery.lotteryOwner();
    expect(result).to.equal(lotteryOwner);
  });

  it("should set the maximum number of entries", async () => {
    const result = parseInt(await this.lottery.maxEntries());
    expect(result).to.equal(maxEntries);
  });

  it("should set the lottery entry fee", async () => {
    const result = web3.utils.fromWei(await this.lottery.entryFee(), "ether");
    expect(result).to.equal(web3.utils.fromWei(entryFee, "ether"));
  });

  it("should set the platform's fee", async () => {
    const result = parseInt(await this.lottery.platformFee());
    expect(result).to.equal(platformFee);
  });

  it("should set the lottery owner's fee", async () => {
    const result = parseInt(await this.lottery.lotteryFee());
    expect(result).to.equal(lotteryFee);
  });

  it("should set the prize pool to zero", async () => {
    const result = parseInt(
      web3.utils.fromWei(await this.lottery.pool(), "ether")
    );
    expect(result).to.equal(0);
  });

  it("should set the entry count to zero", async () => {
    const result = parseInt(await this.lottery.entryCount());
    expect(result).to.equal(0);
  });

  it("should set the drawn flag to false", async () => {
    const result = await this.lottery.drawn();
    expect(result).to.equal(false);
  });
});

describe("Entering the lottery", () => {
  const [platformAdmin, lotteryOwner, player1, player2, player3] = accounts;
  const maxEntries = 2;
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = 400;
  const platformFee = 200;

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
    const incorrectEntryFee = new BN("500000000000000000");
    await expectRevert(
      this.lottery.enter({ value: incorrectEntryFee, from: player1 }),
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
    const result = parseInt(await this.lottery.entryCount());
    expect(result).to.equal(1);
  });

  it("should increase the prize pool when a player enters", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = parseInt(await this.lottery.pool());
    expect(result).to.equal(parseInt(entryFee));
  });

  it("should add the player's address to the entries array", async () => {
    await this.lottery.enter({ value: entryFee, from: player1 });
    const result = await this.lottery.entries(0);
    expect(result).to.equal(player1);
  });
});

xdescribe("Drawing a winner", () => {});

xdescribe("Withrdawing funds", () => {});

xdescribe("Pausing the contract", () => {});
