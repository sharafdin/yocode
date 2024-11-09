import inquirer from 'inquirer';

export async function getPrompts() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'languageType',
            message: 'Select the language you want to use:',
            choices: [
                'TypeScript',
                'JavaScript'
            ]
        },
        {
            type: 'input',
            name: 'displayName',
            message: "Enter a display name for your extension:",
            validate: input => input ? true : 'Display name is required.'
        },
        {
            type: 'input',
            name: 'identifier',
            message: "Enter an identifier for your extension:",
            default: answers => answers.displayName.toLowerCase().replace(/\s+/g, '-'),
            validate: input => {
                const isValid = /^[a-z0-9\-]+$/.test(input);
                return isValid || 'Identifier must be lowercase and contain only letters, numbers, and hyphens.';
            },
            filter: input => input.toLowerCase().replace(/\s+/g, '-')
        },
        {
            type: 'input',
            name: 'description',
            message: "Provide a brief description for your extension:"
        },
        {
            type: 'confirm',
            name: 'jsTypeChecking',
            message: "Enable JavaScript type checking in 'jsconfig.json'?",
            default: false,
            when: answers => answers.languageType.includes('JavaScript')
        },
        {
            type: 'confirm',
            name: 'gitInit',
            message: 'Do you want to initialize a Git repository?',
            default: true
        },
        {
            type: 'list',
            name: 'packageManager',
            message: 'Select a package manager to use:',
            choices: ['npm', 'yarn', 'pnpm'],
            default: 'npm'
        }
    ]);

    return answers;
}
