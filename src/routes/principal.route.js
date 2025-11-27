import {Router} from 'express';
import {addPrincipal} from '../controllers/principal.controller.js';
import {editPrincipal} from '../controllers/principal.controller.js';
import {resetPrincipalPassword} from '../controllers/principal.controller.js';
import {assignNewPrincipal} from '../controllers/principal.controller.js';

const router = Router();

router.route('/add-principal').post(addPrincipal)
router.route('/:schoolCode/edit').put(editPrincipal);
router.route('/:schoolCode/reset-password').put(resetPrincipalPassword);
router.route('/:schoolCode/re-assign-principal').post(assignNewPrincipal);

export default router;