export function optimizePayments(
  initialBalances: Array<{ id: string; balance: number }>,
) {
  const payments: Array<{ fromId: string; toId: string; amount: number }> = [];
  const balances = structuredClone(initialBalances);
  balances.sort((a, b) => a.balance - b.balance);

  let i = 0;
  while (balances[0].balance < 0 && i < balances.length * 5) {
    const from = balances[0];
    const to = balances.at(-1)!;
    const amount = Math.min(-from.balance, to.balance);

    payments.push({
      fromId: from.id,
      toId: to.id,
      amount,
    });

    from.balance += amount;
    to.balance -= amount;

    balances.sort((a, b) => a.balance - b.balance);
    i++;
  }

  return payments;
}
