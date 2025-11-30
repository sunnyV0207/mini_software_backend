import mongoose,{Schema} from 'mongoose'

const classSchema = new Schema({
    classNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    section: {
        type: String,
        required: true,
        trim: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true
    },
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true
    },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // required: true
        }
    ],
    subjects: [String]
})

const Class = mongoose.model("Class",classSchema)
export default Class;