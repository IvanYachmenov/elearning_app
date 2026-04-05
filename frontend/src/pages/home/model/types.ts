import type { User } from '../../../shared/types';

export interface HomePageProps {
  user: User;
}

export interface HomeNewsPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
}
