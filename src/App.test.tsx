import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import {AuthenticationState} from "./pages/authencation";

test('renders learn react link', () => {
  render(<App auth={AuthenticationState.instance}/>);
  const linkElement = screen.getByText(/home/i);
  expect(linkElement).toBeInTheDocument();
});
