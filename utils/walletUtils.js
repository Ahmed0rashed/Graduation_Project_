exports.decreaseWalletBalance = async (wallet, amount) => {
  wallet.balance -= amount;
  await wallet.save();
};
