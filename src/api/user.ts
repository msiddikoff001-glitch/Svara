/**
 * User profile & balance.
 *
 * Mocked — replace each function body with `httpRequest('/user', ...)` when
 * the backend exists.
 */
import { MOCK_TRANSACTIONS,MOCK_USER } from '../data/mocks';
import type { Transaction, User } from '../types/domain';

export const fetchCurrentUser = async (): Promise<User> => MOCK_USER;

export const fetchTransactions = async (): Promise<Transaction[]> => MOCK_TRANSACTIONS;
