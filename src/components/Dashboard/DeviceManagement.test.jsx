import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };
jest.mock('../../hooks/useToast', () => ({ useToast: () => mockToast }));

const mockApi = {
    getAllDevices: jest.fn(), getCategories: jest.fn(), createDevice: jest.fn(), updateDevice: jest.fn(), deleteDevice: jest.fn(),
    createCategory: jest.fn(), updateCategory: jest.fn(), deleteCategory: jest.fn(),
};
jest.mock('../../services/api', () => ({ deviceAPI: { ...mockApi } }));

const DeviceManagement = require('./DeviceManagement').default;

const cat = (id, name, over = {}) => ({ category_id: id, name, description: null, requires_hardware_details: true, sort_order: id * 10, is_active: true, total_items: 0, active_items: 0, ...over });
const CATEGORIES = [
    cat(1, 'Mobile Phones', { total_items: 1 }),
    cat(3, 'Laptops & Computers', { total_items: 1 }),
    cat(5, 'Data & Connectivity', { requires_hardware_details: false, total_items: 1 }),
    cat(6, 'Accessories', { is_active: false }),
];
const item = (id, categoryId, categoryName, over = {}) => ({
    device_id: id, device_name: `Item ${id}`, model: 'M', manufacturer: 'Maker', plan_name: 'Plan', plan_details: null,
    monthly_cost: '100.00', contract_duration_months: 24, status: 'active', category_id: categoryId, category_name: categoryName, ...over,
});
const ITEMS = [
    item(1, 1, 'Mobile Phones', { device_name: 'Galaxy A15' }),
    item(2, 3, 'Laptops & Computers', { device_name: 'Latitude 5440' }),
    item(3, 5, 'Data & Connectivity', { device_name: '20GB Bundle', model: null, manufacturer: null }),
];

beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getAllDevices.mockResolvedValue({ data: { data: ITEMS } });
    mockApi.getCategories.mockResolvedValue({ data: { data: { categories: CATEGORIES } } });
    mockApi.createDevice.mockResolvedValue({ data: { message: 'Created.' } });
});

const open = async () => { render(<DeviceManagement />); await screen.findByText('Galaxy A15'); };

describe('catalogue management with categories', () => {
    it('shows a chip per category with counts (hidden ones too) and filters the table', async () => {
        await open();
        const tabs = screen.getByRole('tablist', { name: /categories/i });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(
            ['All 3', 'Mobile Phones 1', 'Laptops & Computers 1', 'Data & Connectivity 1', 'Accessories 0']);

        fireEvent.click(within(tabs).getByRole('tab', { name: /laptops/i }));
        expect(screen.queryByText('Galaxy A15')).not.toBeInTheDocument();
        expect(screen.getByText('Latitude 5440')).toBeInTheDocument();
        expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('lists each item with its category', async () => {
        await open();
        const row = screen.getByText('20GB Bundle').closest('tr');
        expect(within(row).getByText('Data & Connectivity')).toBeInTheDocument();
        expect(row.textContent).not.toMatch(/null|undefined/);
    });

    it('a new item in a hardware category needs a model and manufacturer; in a service category it does not', async () => {
        await open();
        fireEvent.click(screen.getByRole('button', { name: /add item/i }));
        const dialog = await screen.findByRole('dialog');

        fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /category/i }));
        fireEvent.click(await screen.findByRole('option', { name: 'Data & Connectivity' }));
        expect(within(dialog).getByText(/model and manufacturer are optional/i)).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText(/^name/i), { target: { value: '50GB Bundle' } });
        fireEvent.change(within(dialog).getByLabelText(/^plan name/i), { target: { value: 'Monthly 50GB' } });
        fireEvent.change(within(dialog).getByLabelText(/monthly cost/i), { target: { value: '299' } });
        fireEvent.mouseDown(within(dialog).getAllByRole('combobox').find((c) => /choose|months/i.test(c.textContent)));
        fireEvent.click(await screen.findByRole('option', { name: '12 Months' }));
        fireEvent.click(within(dialog).getByRole('button', { name: /add item/i }));

        await waitFor(() => expect(mockApi.createDevice).toHaveBeenCalled());
        expect(mockApi.createDevice.mock.calls[0][0]).toMatchObject({
            category_id: 5, device_name: '50GB Bundle', model: null, manufacturer: null, plan_name: 'Monthly 50GB', monthly_cost: 299, contract_duration_months: 12,
        });
    });

    it('a hardware category refuses to save without a model', async () => {
        await open();
        fireEvent.click(screen.getByRole('button', { name: /add item/i }));
        const dialog = await screen.findByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/^name/i), { target: { value: 'Some laptop' } });
        fireEvent.change(within(dialog).getByLabelText(/^plan name/i), { target: { value: 'Plan' } });
        fireEvent.change(within(dialog).getByLabelText(/monthly cost/i), { target: { value: '650' } });
        fireEvent.click(within(dialog).getByRole('button', { name: /add item/i }));

        expect(await within(dialog).findByText(/model is required for this category/i)).toBeInTheDocument();
        expect(mockApi.createDevice).not.toHaveBeenCalled();
    });

    it('with an older server that has no categories, nothing about categories is shown', async () => {
        mockApi.getCategories.mockRejectedValue(new Error('404'));
        render(<DeviceManagement />);
        await screen.findByText('Galaxy A15');
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /manage categories/i })).not.toBeInTheDocument();
    });
});

describe('the category manager', () => {
    const manager = async () => {
        await open();
        fireEvent.click(screen.getByRole('button', { name: /manage categories/i }));
        return screen.findByRole('dialog');
    };

    it('lists categories with their item counts and what each needs', async () => {
        const dialog = await manager();
        expect(within(within(dialog).getByTestId('category-5')).getByText('No hardware details')).toBeInTheDocument();
        expect(within(within(dialog).getByTestId('category-6')).getByText('Hidden from clients')).toBeInTheDocument();
        expect(within(within(dialog).getByTestId('category-1')).getByText('1 item')).toBeInTheDocument();
    });

    it('adds a category', async () => {
        mockApi.createCategory.mockResolvedValue({ data: { message: '"Printers" has been added.' } });
        const dialog = await manager();
        fireEvent.click(within(dialog).getByRole('button', { name: /add category/i }));
        fireEvent.change(within(dialog).getByLabelText(/^name/i), { target: { value: 'Printers' } });
        fireEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));

        await waitFor(() => expect(mockApi.createCategory).toHaveBeenCalledWith({ name: 'Printers', description: null, requires_hardware_details: true }));
        await waitFor(() => expect(mockApi.getAllDevices).toHaveBeenCalledTimes(2));   // the screen reloads
    });

    it('switches a category off', async () => {
        mockApi.updateCategory.mockResolvedValue({ data: {} });
        const dialog = await manager();
        fireEvent.click(within(dialog).getByRole('switch', { name: /mobile phones visible to clients/i }));
        await waitFor(() => expect(mockApi.updateCategory).toHaveBeenCalledWith(1, { is_active: false }));
    });

    it('does not let a category that holds items be deleted, but deletes an empty one after asking', async () => {
        mockApi.deleteCategory.mockResolvedValue({ data: { message: 'Deleted.' } });
        window.confirm = jest.fn(() => true);
        const dialog = await manager();
        expect(within(dialog).getByRole('button', { name: /delete mobile phones/i })).toBeDisabled();

        fireEvent.click(within(dialog).getByRole('button', { name: /delete accessories/i }));
        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => expect(mockApi.deleteCategory).toHaveBeenCalledWith(6));
    });

    it("shows the server's reason when a category cannot be saved", async () => {
        mockApi.createCategory.mockRejectedValue({ response: { data: { message: 'A category called "Tablets" already exists.' } } });
        const dialog = await manager();
        fireEvent.click(within(dialog).getByRole('button', { name: /add category/i }));
        fireEvent.change(within(dialog).getByLabelText(/^name/i), { target: { value: 'Tablets' } });
        fireEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));
        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('A category called "Tablets" already exists.', 'Categories'));
    });
});
