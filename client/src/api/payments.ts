import { DEPOSIT_METHODS, WITHDRAW_METHODS } from '../data/mocks';
import type { DepositMethod, WithdrawMethod } from '../types/domain';

export const fetchDepositMethods = async (): Promise<DepositMethod[]> => DEPOSIT_METHODS;
export const fetchWithdrawMethods = async (): Promise<WithdrawMethod[]> => WITHDRAW_METHODS;

export interface CreateDepositInput {
  method: string;
  amount: number;
}

export interface DepositReceipt {
  ok: true;
  method: string;
  amount: number;
  txId: string;
}

export const createDeposit = async ({
  method,
  amount,
}: CreateDepositInput): Promise<DepositReceipt> => ({
  ok: true,
  method,
  amount,
  txId: `mock_${Date.now()}`,
});

export interface CreateWithdrawalInput {
  method: string;
  amount: number;
  address: string;
}

export interface WithdrawalReceipt {
  ok: true;
  method: string;
  amount: number;
  address: string;
  txId: string;
}

export const createWithdrawal = async ({
  method,
  amount,
  address,
}: CreateWithdrawalInput): Promise<WithdrawalReceipt> => ({
  ok: true,
  method,
  amount,
  address,
  txId: `mock_${Date.now()}`,
});
