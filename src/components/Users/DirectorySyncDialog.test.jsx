import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockSync = jest.fn();
jest.mock('../../services/api', () => ({ adminAPI: { syncDirectory: (...a) => mockSync(...a) } }));

const DirectorySyncDialog = require('./DirectorySyncDialog').default;

const staffResult = { dryRun: true, created: 2, updated: 1, revoked: 1, errors: [], clients: null };
const clientResult = (over = {}) => ({
    dryRun: true, created: 0, updated: 0, revoked: 0, errors: [],
    clients: { source: 'everyone', found: 12, created: 8, linked: 1, updated: 1, skippedStaff: 2, skippedDeactivated: 0, skippedNoEmail: 1, ...over },
});

beforeEach(() => jest.clearAllMocks());

describe('staff sync (unchanged)', () => {
    it('previews, then applies, and tells the page to refresh', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: staffResult } }).mockResolvedValueOnce({ data: { data: { ...staffResult, dryRun: false } } });
        const onApplied = jest.fn();
        render(<DirectorySyncDialog open onClose={() => {}} onApplied={onApplied} />);

        expect(await screen.findByText(/preview: nothing has changed yet/i)).toBeInTheDocument();
        expect(mockSync).toHaveBeenCalledWith(true, undefined);
        expect(screen.getByText('To create')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /apply sync/i }));
        await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument());
        expect(mockSync).toHaveBeenLastCalledWith(false, undefined);
        expect(onApplied).toHaveBeenCalled();
    });
});

describe('client import', () => {
    it('previews what would be added, linked and updated, and what is left out', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: clientResult() } });
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} />);

        expect(await screen.findByText('Import clients from the directory')).toBeInTheDocument();
        expect(mockSync).toHaveBeenCalledWith(true, 'clients');
        expect(await screen.findByText('To add')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText(/found 12 in the directory/i)).toBeInTheDocument();
        expect(screen.getByText(/left out: 2 staff, 1 without an email address/i)).toBeInTheDocument();
        expect(screen.getByText(/no emails are sent/i)).toBeInTheDocument();
    });

    it('imports only after confirmation, then refreshes the list', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: clientResult() } }).mockResolvedValueOnce({ data: { data: clientResult({ dryRun: false }) } });
        const onApplied = jest.fn();
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} onApplied={onApplied} />);
        await screen.findByText('To add');
        expect(onApplied).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /import clients/i }));
        expect(await screen.findByText('Done')).toBeInTheDocument();
        expect(mockSync).toHaveBeenLastCalledWith(false, 'clients');
        expect(screen.getByText('Added')).toBeInTheDocument();
        expect(onApplied).toHaveBeenCalledTimes(1);
    });

    it('says so when everyone is already in, and offers nothing to apply', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: clientResult({ created: 0, linked: 0, updated: 0 }) } });
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} />);
        expect(await screen.findByText(/everything is already up to date/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /import clients/i })).not.toBeInTheDocument();
    });

    it('shows the people it could not import', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: { ...clientResult(), errors: [{ account: 'a@b.za', message: 'This email is already linked to a different directory account.' }] } } });
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} />);
        expect(await screen.findByText('a@b.za')).toBeInTheDocument();
        expect(screen.getByText(/already linked to a different directory account/i)).toBeInTheDocument();
    });

    it('does not show staff numbers if an older server ignores the scope', async () => {
        mockSync.mockResolvedValueOnce({ data: { data: staffResult } });
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} />);
        expect(await screen.findByRole('alert')).toHaveTextContent(/does not support importing clients/i);
        expect(screen.queryByText('To create')).not.toBeInTheDocument();
    });

    it("shows the server's reason when the directory cannot be read", async () => {
        mockSync.mockRejectedValueOnce({ response: { data: { message: 'The directory could not be reached.' } } });
        render(<DirectorySyncDialog open scope="clients" onClose={() => {}} />);
        expect(await screen.findByRole('alert')).toHaveTextContent('The directory could not be reached.');
    });
});
