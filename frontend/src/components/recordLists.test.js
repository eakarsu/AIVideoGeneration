import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { recordList } from '../services/recordList';
import CrudPage from './CrudPage';
import api from '../services/api';
import AIReport from './AIReport';
import AIFieldPresets, { completeExample } from './AIFieldPresets';
import Login from '../pages/Login';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
global.IS_REACT_ACT_ENVIRONMENT = true;

test('a paginated native record response renders all 15 project rows', async () => {
  const names = [
    'Sunset Timelapse', 'Product Launch Promo', 'Music Video - Neon Dreams',
    'Nature Documentary Intro', 'Fashion Lookbook', 'Sci-Fi Short Film',
    'Real Estate Tour', 'Wedding Highlight', 'Food Commercial',
    'Travel Vlog Intro', 'Fitness App Promo', 'Abstract Art Animation',
    'Corporate Presentation', 'Horror Short - The Mirror', 'Social Media Ad Pack',
  ]; // The 15 video_projects entries in backend/seeds/seed.js.
  api.get.mockResolvedValue({ data: { data: names.map((name, index) => ({ id: index + 1, name })), pagination: { total: 15 } } });
  const host = document.createElement('div');
  const errors = jest.spyOn(console, 'error');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(<CrudPage title="Video Projects" apiPath="/projects" columns={[{ key: 'name', label: 'Name' }]} formFields={[]} />); });
  expect(host.querySelectorAll('tbody tr')).toHaveLength(15);
  names.forEach((name) => expect(host.textContent).toContain(name));
  expect(errors).not.toHaveBeenCalled();
  await act(async () => root.unmount());
  host.remove();
  errors.mockRestore();
});

test('malformed record payloads report an error rather than reaching a list renderer', () => {
  expect(() => recordList({ data: { error: 'unavailable' } })).toThrow('did not return a list');
  expect(recordList({ items: [{ id: 1 }] })).toHaveLength(1);
});

test('preset buttons fill optional values while preserving real references and files', async () => {
  const fields = [
    { key: 'prompt', type: 'textarea' }, { key: 'negative_prompt', type: 'textarea' },
    { key: 'project_id', type: 'select', options: [{ value: 7 }, { value: 9 }] },
    { key: 'source_file', type: 'file' },
  ];
  const upload = new File(['sample'], 'source.png');
  const current = { project_id: 9, source_file: upload };
  const sample = { label: 'Landscape', values: { prompt: 'Slow aerial view over a coastal landscape.' } };
  const onFill = jest.fn();
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<AIFieldPresets fields={fields} samples={[sample]} onFill={onFill} />));
  expect(host.querySelectorAll('button')).toHaveLength(3);
  await act(async () => host.querySelector('button').click());
  expect(onFill).toHaveBeenCalledTimes(1);
  const filled = completeExample(fields, sample, 0, 'Text to Video', current);
  expect(filled.prompt).toBe(sample.values.prompt);
  expect(filled.negative_prompt).toBeTruthy();
  expect(filled.project_id).toBe(9);
  expect(filled.source_file).toBe(upload);
  await act(async () => root.unmount()); host.remove();
});

test('returned and saved JSON render labels, a table, false, zero, and empty text', async () => {
  const output = { status: { approved: false, score: 0, note: '' }, scenes: [{ title: 'Opening', duration_seconds: 0 }] };
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<><AIReport response={{ output }} title="Returned" /><AIReport response={{ output, id: 3 }} title="Saved" /></>));
  expect(host.querySelectorAll('table')).toHaveLength(2);
  expect(host.textContent).toContain('Approved');
  expect(host.textContent).toContain('No');
  expect(host.textContent).toContain('0');
  expect(host.textContent).toContain('(empty string)');
  expect(host.textContent).toContain('Duration seconds');
  await act(async () => root.unmount()); host.remove();
});

test('demo login uses the configured account endpoint without exposing credentials in the request', async () => {
  api.post.mockResolvedValue({ data: { token: 'fixture-token', user: { id: 1, name: 'Demo' } } });
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Login /></MemoryRouter>));
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === 'Demo Login');
  expect(button).toBeTruthy();
  await act(async () => button.click());
  expect(api.post).toHaveBeenCalledWith('/auth/demo-login');
  await act(async () => root.unmount()); host.remove();
  localStorage.removeItem('token'); localStorage.removeItem('user');
});
