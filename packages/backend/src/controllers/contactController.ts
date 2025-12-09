import { Request, Response, NextFunction } from "express";
import AppError from "../middlewares/errorHandler.js";
import ContactService from "../services/contactService.js";

export default class ContactController {
    private contactService: ContactService;

    public constructor(contactService: ContactService) {
        this.contactService = contactService;
    }

    public async listContacts(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const data = await this.contactService.listContacts(req.user.id);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    public async addContact(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawEmail = req.body.email;
            if (typeof rawEmail !== "string") {
                throw new AppError("Email must be a string", 400);
            }

            const contact = await this.contactService.addContact(req.user.id, rawEmail);
            res.status(201).json({
                message: "Contact added successfully",
                data: contact,
            });
        } catch (error) {
            next(error);
        }
    }

    public async deleteContact(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawId = req.params.id;
            const contactId = Number.parseInt(rawId, 10);

            if (!Number.isFinite(contactId) || contactId <= 0) {
                throw new AppError("Invalid contact id", 400);
            }

            await this.contactService.removeContact(req.user.id, contactId);
            res.status(200).json({ message: "Contact deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}
