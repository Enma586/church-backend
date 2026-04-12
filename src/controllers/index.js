/**
 * @description Master entry point for all Controllers.
 * Centralizes the 5 domains for clean access in the routing layer.
 */

// 1. Address Domain
import { 
    DepartmentController, 
    MunicipalityController 
} from './address/index.js';

// 2. Members & Auth Domain
import { 
    MemberController, 
    UserController 
} from './members/index.js';

// 3. Appointments Domain
import { 
    AppointmentController 
} from './appointments/index.js';

// 4. Sacraments Domain
import { 
    SacramentController, 
    PastoralNoteController 
} from './sacrament/index.js';

// 5. Config Domain
import { 
    ConfigurationController 
} from './config/index.js';

/**
 * Clean export of all controller objects.
 */
export {
    DepartmentController,
    MunicipalityController,
    MemberController,
    UserController,
    AppointmentController,
    SacramentController,
    PastoralNoteController,
    ConfigurationController
};