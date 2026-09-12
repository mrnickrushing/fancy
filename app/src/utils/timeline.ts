import { FULFILLMENT_SHORT, type Order } from '../api/types';
import { fmtDate, fmtDateTime, fmtMoney, toNumber } from './format';
import { balanceDue } from './payment';

// done — it happened. part — it half happened, which is what a deposit is.
// todo — it has not happened yet. off — it will not happen now.
export type StepState = 'done' | 'part' | 'todo' | 'off';
export type Step = { key: string; title: string; detail: string; state: StepState };

// The one thing left worth doing, or nothing when the order is settled or
// closed. The detail screen leads with this so Amanda does not have to read
// the whole order to work out what it wants from her.
export type Act = 'accept' | 'payment' | 'handover' | null;

export function orderTimeline(order: Order): Step[] {
  const asked: Step = {
    key: 'asked',
    title: 'Asked for',
    detail: `${order.source === 'manual' ? 'Written in by you' : 'From the website'}, ${fmtDateTime(order.created_at)}`,
    state: 'done',
  };

  // A declined or cancelled order stops where it stopped. Showing it the rest
  // of the way, greyed, would suggest work still to come that never will.
  if (order.status === 'declined') {
    return [asked, { key: 'end', title: 'Declined', detail: 'They were told.', state: 'off' }];
  }
  if (order.status === 'cancelled') {
    return [asked, { key: 'end', title: 'Cancelled', detail: 'It stays in the book, marked cancelled.', state: 'off' }];
  }

  const answered: Step =
    order.status === 'pending'
      ? { key: 'answer', title: 'Waiting on you', detail: 'Accept it, or decline it.', state: 'todo' }
      : {
          key: 'answer',
          title: 'Accepted, confirmation sent',
          detail: order.amount === null ? 'No total set yet.' : `Total set to ${fmtMoney(order.amount)}`,
          state: 'done',
        };

  const paid = toNumber(order.paid_amount);
  const owed = balanceDue(order.paid_amount, order.amount, order.payment_status);
  let money: Step;
  if (order.payment_status === 'paid') {
    money = { key: 'money', title: 'Paid in full', detail: fmtMoney(order.amount ?? paid), state: 'done' };
  } else if (order.payment_status === 'refunded') {
    money = { key: 'money', title: 'Refunded', detail: `${fmtMoney(paid)} went back to them.`, state: 'off' };
  } else if (paid > 0) {
    money = {
      key: 'money',
      title: 'Deposit paid',
      detail: `${fmtMoney(paid)} of ${fmtMoney(order.amount)}${owed === null ? '' : ` · ${fmtMoney(owed)} still owed`}`,
      state: 'part',
    };
  } else {
    money = {
      key: 'money',
      title: 'Nothing paid yet',
      detail: order.amount === null ? 'No total set yet.' : `${fmtMoney(order.amount)} owed`,
      state: 'todo',
    };
  }

  const where = `${fmtDate(order.needed_date)} · ${FULFILLMENT_SHORT[order.fulfillment].toLowerCase()}`;
  const handover: Step =
    order.status === 'completed'
      ? { key: 'handover', title: 'Baked and handed over', detail: where, state: 'done' }
      : { key: 'handover', title: 'Baked and handed over', detail: `Wanted ${where}`, state: 'todo' };

  return [asked, answered, money, handover];
}

export function nextAct(order: Order): Act {
  if (order.status === 'pending') return 'accept';
  if (order.status !== 'accepted') return null;
  const owed = balanceDue(order.paid_amount, order.amount, order.payment_status);
  if (owed !== null && owed > 0) return 'payment';
  return 'handover';
}
