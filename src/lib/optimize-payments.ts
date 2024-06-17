export function optimizePayments(
  initialBalances: Array<{ id: string; balance: number }>,
) {
  const payments: Array<{ fromId: string; toId: string; amount: number }> = [];
  const balances = structuredClone(initialBalances);
  balances.sort((a, b) => a.balance - b.balance);

  let i = 0;
  while (balances[0].balance <= -0.01 && i < balances.length * 5) {
    const from = balances[0];
    const to = balances.at(-1)!;
    const amount = Number(Math.min(-from.balance, to.balance).toFixed(2));

    payments.push({
      fromId: from.id,
      toId: to.id,
      amount,
    });

    from.balance = Number((from.balance + amount).toFixed(2));
    to.balance = Number((to.balance - amount).toFixed(2));

    balances.sort((a, b) => a.balance - b.balance);
    i++;
  }

  return payments;
}
