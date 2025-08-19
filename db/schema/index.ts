import { user, session, account, verification } from './auth';
import { preference } from './preference';
import { company } from './company';
import { page } from './page';
import { snapshot } from './snapshot';
import {
    userRelations,
    preferenceRelations,
    companyRelations,
    pageRelations,
    snapshotRelations,
} from './relations';

export const schema = {
    user: user,
    session: session,
    account: account,
    verification: verification,
    preference: preference,
    company: company,
    page: page,
    snapshot: snapshot,
};

export const relations = {
    userRelations: userRelations,
    preferenceRelations: preferenceRelations,
    companyRelations: companyRelations,
    pageRelations: pageRelations,
    snapshotRelations: snapshotRelations,
};
