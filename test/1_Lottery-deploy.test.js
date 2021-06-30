const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect, assert } = require("chai");
const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const Lottery = contract.fromArtifact("Lottery"); // Loads a compiled contract

describe("Deploying the lottery contract", function () {
  this.timeout(10000);

  const [platformAdmin, lotteryOwner] = accounts;
  const maxEntries = new BN("2");
  const entryFee = new BN("1000000000000000000");
  const lotteryFee = new BN("25");
  const platformFee = new BN("50");

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

  it("should set the platform administrator", async () => {
    const result = await this.lottery.platformAdmin();
    expect(result).to.equal(platformAdmin);
  });

  it("should set the lottery owner", async () => {
    const result = await this.lottery.lotteryOwner();
    expect(result).to.equal(lotteryOwner);
  });

  it("should set the maximum number of entries", async () => {
    const result = await this.lottery.maxEntries();
    expect(result).to.be.bignumber.equal(maxEntries);
  });

  it("should set the lottery entry fee", async () => {
    const result = await this.lottery.entryFee();
    expect(result).to.be.bignumber.equal(entryFee);
  });

  it("should set the platform's fee", async () => {
    const result = await this.lottery.platformFee();
    expect(result).to.be.bignumber.equal(platformFee);
  });

  it("should set the lottery owner's fee", async () => {
    const result = await this.lottery.lotteryFee();
    expect(result).to.be.bignumber.equal(lotteryFee);
  });

  it("should set the prize pool to zero", async () => {
    const result = await this.lottery.pool();
    expect(result).to.be.bignumber.equal(ZERO);
  });

  it("should set the entry count to zero", async () => {
    const result = await this.lottery.entryCount();
    expect(result).to.be.bignumber.equal(ZERO);
  });

  it("should set the drawn flag to false", async () => {
    const result = await this.lottery.drawn();
    expect(result).to.equal(false);
  });
});
