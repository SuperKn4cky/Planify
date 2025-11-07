const validPassword = "Secure123456@";
const uniqueEmail = (prefix: string = "user") => {
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}.${random}@example.com`;
};

type NewUserOptions = {
    first_name?: string;
    last_name?: string;
    email_prefix?: string;
};

const newUser = ({
    first_name = "John",
    last_name = "Doe",
    email_prefix,
}: NewUserOptions = {}) => {
    return {
        first_name,
        last_name,
        email: uniqueEmail(email_prefix),
        password: validPassword,
    };
};

Object.assign(global, {
    validPassword,
    uniqueEmail,
    newUser,
});
