/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed with all input fields", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const html = NewBillUI()
      document.body.innerHTML = html

      const newBillContainer = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId('form-new-bill')
      expect(form).toBeTruthy()

      expect(screen.getByTestId('expense-type')).toBeTruthy()
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()

      const submitButton = screen.getByRole('button', { name: /Envoyer/i })
      expect(submitButton).toBeTruthy()
    })
    test("Then mail icon in vertical layout should be highlighted", async () => {
  
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getAllByTestId('icon-mail'))
        const mailIcon = screen.getAllByTestId('icon-mail')
        expect(mailIcon[0].classList.contains("active-icon")).toBeTruthy()
  
    })
  })
  describe('when I click on the input file', () => {
    test("Then handleChangeFile should upload a file with an extension jpg, jpeg or png", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI()
      const newBillContainer = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId('file')
      const file = new File(['image'], 'facture.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, {
        target: {
          files: [file]
        }
      })

      await waitFor(() => expect(newBillContainer.fileName).toBe('facture.jpg'))
      expect(newBillContainer.fileUrl).toBe('https://localhost:3456/images/test.jpg')
    })
    test("Then handleChangeFile should upload a file with an extension other than jpg, jpeg or png", async () => {
      window.alert = jest.fn()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI()
      const newBillContainer = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId('file')
      const  invalidFile = new File(['document'], 'facture.pdf', { type: 'application/pdf' })

      fireEvent.change(fileInput, {
        target: {
          files: [invalidFile]
        }
      })

      expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers JPG, JPEG et PNG sont autorisés.")
      expect(fileInput.value).toBe("")
    })
  })

  describe('When an error occurs on API', () => {
    let newBillContainer
    let onNavigate

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      onNavigate = jest.fn()
      document.body.innerHTML = NewBillUI()
      newBillContainer = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test("Then new bill is added to the API but fetch fails with '404 page not found' error", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => ({
        update: () => Promise.reject(new Error('404 page not found'))
      }))

      const bill = {
        email: 'employee@test.com',
        type: 'Hôtel et logement',
        name: 'Test bill',
        amount: 100,
        date: '2024-05-22',
        vat: '10',
        pct: 20,
        commentary: 'Test comment',
        fileUrl: 'https://localhost:3456/images/test.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      }

      newBillContainer.updateBill(bill)
      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled())
      expect(consoleErrorSpy.mock.calls[0][0].message).toBe('404 page not found')
    })

    test("Then new bill is added to the API but fetch fails with '500 Internal Server error'", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => ({
        update: () => Promise.reject(new Error('500 Internal Server error'))
      }))

      const bill = {
        email: 'employee@test.com',
        type: 'Hôtel et logement',
        name: 'Test bill',
        amount: 150,
        date: '2024-05-22',
        vat: '20',
        pct: 20,
        commentary: 'Test comment',
        fileUrl: 'https://localhost:3456/images/test.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      }

      newBillContainer.updateBill(bill)
      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled())
      expect(consoleErrorSpy.mock.calls[0][0].message).toBe('500 Internal Server error')
    })
  })
})
