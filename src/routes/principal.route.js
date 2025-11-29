import {Router} from 'express';
import {addPrincipal} from '../controllers/principal.controller.js';
import {editPrincipal} from '../controllers/principal.controller.js';
import {resetPrincipalPassword} from '../controllers/principal.controller.js';
import {assignNewPrincipal} from '../controllers/principal.controller.js';
import {fetchPrincipals} from '../controllers/principal.controller.js';
import {getPrincipalById} from '../controllers/principal.controller.js';
import {updatePrincipal} from '../controllers/principal.controller.js';
import {deletePrincipal} from '../controllers/principal.controller.js';

const router = Router();

router.route('/fetch-principals').get(fetchPrincipals); // This route seems to be handled elsewhere
router.route('/add-principal').post(addPrincipal)
router.route('/:schoolCode/edit').put(editPrincipal);
router.route('/:schoolCode/reset-password').put(resetPrincipalPassword);
router.route('/:schoolCode/re-assign-principal').post(assignNewPrincipal);
router.route('/:principalId').get(getPrincipalById); // Added to fetch particular principal
router.route('/update-principal/:principalId').put(updatePrincipal); // Added to update particular principal
router.route('/:principalId/delete').delete(deletePrincipal); // Added to delete particular principal

export default router;