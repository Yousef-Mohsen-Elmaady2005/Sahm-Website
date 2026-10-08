import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RealEstate from './Pages/RealEstate';

test('filters properties by selected category', async () => {
  const user = userEvent.default ? userEvent.default : userEvent;

  render(<RealEstate />);

  expect(screen.getByText('حي التميز')).toBeInTheDocument();
  expect(screen.getByText('الغدير')).toBeInTheDocument();
  expect(screen.getByText('عقار جدة التجريبي')).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText('تصنيف العقارات'), 'residential');

  expect(screen.getByText('حي التميز')).toBeInTheDocument();
  expect(screen.queryByText('الغدير')).not.toBeInTheDocument();
  expect(screen.queryByText('عقار جدة التجريبي')).not.toBeInTheDocument();
});

test('applies search selections from the URL and updates the result count', () => {
  window.history.pushState(
    {},
    '',
    '/real-estate?mode=rent&location=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6&type=%D8%A8%D8%B1%D8%AC&rooms=9'
  );

  render(<RealEstate />);

  expect(screen.getByText('الغدير')).toBeInTheDocument();
  expect(screen.queryByText('حي التميز')).not.toBeInTheDocument();
  expect(screen.queryByText('عقار جدة التجريبي')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /نتائج البحث/ })).toHaveTextContent('1 عقار');

  window.history.replaceState({}, '', '/');
});
