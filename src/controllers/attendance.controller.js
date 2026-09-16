import asyncHandler from "../utilities/asynchandler.js";
import ApiResponse from "../utilities/ApiResponse.js";
import ApiError from "../utilities/ApiError.js";
import User from "../models/user.model.js";
import Class from "../models/class.model.js";
import Attendance from "../models/attendance.model.js";
import mongoose from "mongoose";

// Helper: Calculate total days in a month
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Helper: Check if a day is Sunday (0 = Sunday)
const isSunday = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
};

// Helper: Compute working days and student summary
const computeStudentSummary = (dailyList, totalDays, holidays = [], year, month) => {
  let workingDaysCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const isSun = isSunday(year, month, d);
    const isHol = holidays.includes(d);
    if (!isSun && !isHol) {
      workingDaysCount++;
    }
  }

  let present = 0;
  let absent = 0;
  let late = 0;
  let halfDay = 0;
  let holiday = 0;

  dailyList.forEach((entry) => {
    const isSun = isSunday(year, month, entry.day);
    const isHol = holidays.includes(entry.day);

    if (isSun || isHol || entry.status === "Sunday" || entry.status === "Holiday") {
      holiday++;
    } else if (entry.status === "Present") {
      present++;
    } else if (entry.status === "Absent") {
      absent++;
    } else if (entry.status === "Late") {
      late++;
      present++; // Late counts as present
    } else if (entry.status === "HalfDay") {
      halfDay++;
      present += 0.5; // Half day counts as 0.5
    }
  });

  const percentage =
    workingDaysCount > 0
      ? Math.min(100, Math.round((present / workingDaysCount) * 1000) / 10)
      : 0;

  return {
    totalWorkingDays: workingDaysCount,
    presentDays: Math.floor(present),
    absentDays: absent,
    lateDays: late,
    halfDays: halfDay,
    holidayDays: holiday,
    percentage,
  };
};

// ==========================================
// 1. GET ATTENDANCE REGISTER (By Month & Year)
// ==========================================
export const getAttendanceRegister = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const reqMonth = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
  const reqYear = req.query.year ? Number(req.query.year) : new Date().getFullYear();

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return next(new ApiError(400, "Valid Teacher ID is required"));
  }

  const teacher = await User.findById(teacherId).populate("school");
  if (!teacher) {
    return next(new ApiError(404, "Teacher not found"));
  }

  // Find class assigned to teacher
  let classDoc = null;
  if (teacher.class) {
    classDoc = await Class.findById(teacher.class).populate("school", "schoolName schoolCode");
  }
  if (!classDoc) {
    classDoc = await Class.findOne({ classTeacher: teacher._id }).populate(
      "school",
      "schoolName schoolCode"
    );
  }

  if (!classDoc) {
    return res.status(200).json(
      new ApiResponse(200, "No class assigned to this teacher", {
        hasClass: false,
        teacher: { _id: teacher._id, name: teacher.name },
      })
    );
  }

  // Fetch all enrolled students for this class
  const students = await User.find({
    class: classDoc._id,
    role: "Student",
  }).select("name email phone gender rollNumber parentName parentPhone status");

  // Sort students naturally by roll number or name
  students.sort((a, b) => {
    const rollA = parseInt(a.rollNumber, 10);
    const rollB = parseInt(b.rollNumber, 10);
    if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
    return (a.name || "").localeCompare(b.name || "");
  });

  const totalDays = getDaysInMonth(reqYear, reqMonth);

  // Find or create Attendance register document
  let attendance = await Attendance.findOne({
    class: classDoc._id,
    month: reqMonth,
    year: reqYear,
  });

  if (!attendance) {
    // Generate initial blank records for each student
    const initialRecords = students.map((st) => {
      const daily = [];
      for (let day = 1; day <= totalDays; day++) {
        const isSun = isSunday(reqYear, reqMonth, day);
        daily.push({
          day,
          status: isSun ? "Sunday" : "Unmarked",
          note: "",
        });
      }
      const summary = computeStudentSummary(daily, totalDays, [], reqYear, reqMonth);
      return {
        student: st._id,
        rollNumber: st.rollNumber || "",
        studentName: st.name,
        gender: st.gender || "Male",
        daily,
        summary,
      };
    });

    let workingDaysCount = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (!isSunday(reqYear, reqMonth, d)) workingDaysCount++;
    }

    attendance = await Attendance.create({
      class: classDoc._id,
      school: classDoc.school?._id || teacher.school?._id,
      teacher: teacher._id,
      month: reqMonth,
      year: reqYear,
      totalDays,
      totalWorkingDays: workingDaysCount,
      holidays: [],
      records: initialRecords,
      status: "Draft",
    });
  } else {
    // Check if new students were enrolled since creation and add them seamlessly
    let recordsUpdated = false;
    const existingStudentIds = new Set(attendance.records.map((r) => String(r.student)));

    students.forEach((st) => {
      if (!existingStudentIds.has(String(st._id))) {
        const daily = [];
        for (let day = 1; day <= totalDays; day++) {
          const isSun = isSunday(reqYear, reqMonth, day);
          const isHol = (attendance.holidays || []).includes(day);
          daily.push({
            day,
            status: isSun ? "Sunday" : isHol ? "Holiday" : "Unmarked",
            note: "",
          });
        }
        const summary = computeStudentSummary(
          daily,
          totalDays,
          attendance.holidays || [],
          reqYear,
          reqMonth
        );
        attendance.records.push({
          student: st._id,
          rollNumber: st.rollNumber || "",
          studentName: st.name,
          gender: st.gender || "Male",
          daily,
          summary,
        });
        recordsUpdated = true;
      }
    });

    // Update names/rolls if changed
    attendance.records.forEach((rec) => {
      const matched = students.find((s) => String(s._id) === String(rec.student));
      if (matched) {
        if (rec.studentName !== matched.name || rec.rollNumber !== matched.rollNumber) {
          rec.studentName = matched.name;
          rec.rollNumber = matched.rollNumber || "";
          recordsUpdated = true;
        }
      }
    });

    if (recordsUpdated) {
      await attendance.save();
    }
  }

  // Sort register records by rollNumber
  attendance.records.sort((a, b) => {
    const rollA = parseInt(a.rollNumber, 10);
    const rollB = parseInt(b.rollNumber, 10);
    if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
    return (a.studentName || "").localeCompare(b.studentName || "");
  });

  return res.status(200).json(
    new ApiResponse(200, "Attendance register fetched successfully", {
      hasClass: true,
      classData: {
        _id: classDoc._id,
        classNumber: classDoc.classNumber,
        section: classDoc.section,
        school: classDoc.school,
      },
      register: attendance,
      meta: {
        month: reqMonth,
        year: reqYear,
        totalDays,
        totalStudents: students.length,
      },
    })
  );
});

// ==========================================
// 2. SAVE DRAFT ATTENDANCE / CELL UPDATES
// ==========================================
export const saveDailyAttendance = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const { month, year, records, holidays, notes } = req.body;

  if (!teacherId || !month || !year) {
    return next(new ApiError(400, "Teacher ID, month, and year are required"));
  }

  const teacher = await User.findById(teacherId);
  if (!teacher) {
    return next(new ApiError(404, "Teacher not found"));
  }

  let classDoc = null;
  if (teacher.class) {
    classDoc = await Class.findById(teacher.class);
  }
  if (!classDoc) {
    classDoc = await Class.findOne({ classTeacher: teacher._id });
  }

  if (!classDoc) {
    return next(new ApiError(404, "No class assigned to this teacher"));
  }

  const attendance = await Attendance.findOne({
    class: classDoc._id,
    month: Number(month),
    year: Number(year),
  });

  if (!attendance) {
    return next(new ApiError(404, "Attendance register not found. Load register first."));
  }

  if (attendance.status === "Completed") {
    return next(
      new ApiError(
        400,
        "This register has been completed and locked. Please reopen it to make changes."
      )
    );
  }

  const totalDays = attendance.totalDays;
  const holidayList = Array.isArray(holidays) ? holidays : attendance.holidays || [];
  attendance.holidays = holidayList;
  if (notes !== undefined) attendance.notes = notes;

  // Update records
  if (Array.isArray(records)) {
    records.forEach((incoming) => {
      const targetRecord = attendance.records.find(
        (r) => String(r.student) === String(incoming.student || incoming.studentId)
      );

      if (targetRecord && Array.isArray(incoming.daily)) {
        incoming.daily.forEach((dayEntry) => {
          const matchedDay = targetRecord.daily.find((d) => d.day === dayEntry.day);
          if (matchedDay) {
            matchedDay.status = dayEntry.status;
            if (dayEntry.note !== undefined) matchedDay.note = dayEntry.note;
          }
        });

        // Recalculate summary
        targetRecord.summary = computeStudentSummary(
          targetRecord.daily,
          totalDays,
          holidayList,
          Number(year),
          Number(month)
        );
      }
    });
  }

  // Recalculate working days
  let workingDaysCount = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (!isSunday(Number(year), Number(month), d) && !holidayList.includes(d)) {
      workingDaysCount++;
    }
  }
  attendance.totalWorkingDays = workingDaysCount;

  await attendance.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance draft saved successfully", attendance));
});

// ==========================================
// 3. COMPLETE & FINALIZE MONTHLY REGISTER
// ==========================================
export const completeMonthlyRegister = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const { month, year, holidays, notes } = req.body;

  if (!teacherId || !month || !year) {
    return next(new ApiError(400, "Teacher ID, month, and year are required"));
  }

  const teacher = await User.findById(teacherId);
  if (!teacher) {
    return next(new ApiError(404, "Teacher not found"));
  }

  let classDoc = null;
  if (teacher.class) {
    classDoc = await Class.findById(teacher.class);
  }
  if (!classDoc) {
    classDoc = await Class.findOne({ classTeacher: teacher._id });
  }

  if (!classDoc) {
    return next(new ApiError(404, "No class assigned to this teacher"));
  }

  const attendance = await Attendance.findOne({
    class: classDoc._id,
    month: Number(month),
    year: Number(year),
  });

  if (!attendance) {
    return next(new ApiError(404, "Attendance register not found"));
  }

  const totalDays = attendance.totalDays;
  const holidayList = Array.isArray(holidays) ? holidays : attendance.holidays || [];
  attendance.holidays = holidayList;
  if (notes !== undefined) attendance.notes = notes;

  let workingDaysCount = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (!isSunday(Number(year), Number(month), d) && !holidayList.includes(d)) {
      workingDaysCount++;
    }
  }
  attendance.totalWorkingDays = workingDaysCount;

  // Finalize all student tallies
  attendance.records.forEach((rec) => {
    rec.summary = computeStudentSummary(
      rec.daily,
      totalDays,
      holidayList,
      Number(year),
      Number(month)
    );
  });

  attendance.status = "Completed";
  attendance.completedAt = new Date();
  attendance.completedBy = teacher._id;

  await attendance.save();

  return res.status(200).json(
    new ApiResponse(200, `Register for Month ${month}/${year} completed and locked!`, {
      attendance,
      summary: {
        totalStudents: attendance.records.length,
        totalWorkingDays: attendance.totalWorkingDays,
        averageAttendancePercentage:
          attendance.records.length > 0
            ? Math.round(
                (attendance.records.reduce((acc, r) => acc + (r.summary?.percentage || 0), 0) /
                  attendance.records.length) *
                  10
              ) / 10
            : 0,
      },
    })
  );
});

// ==========================================
// 4. REOPEN COMPLETED REGISTER
// ==========================================
export const reopenMonthlyRegister = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const { month, year } = req.body;

  if (!teacherId || !month || !year) {
    return next(new ApiError(400, "Teacher ID, month, and year are required"));
  }

  const teacher = await User.findById(teacherId);
  if (!teacher) {
    return next(new ApiError(404, "Teacher not found"));
  }

  let classDoc = null;
  if (teacher.class) {
    classDoc = await Class.findById(teacher.class);
  }
  if (!classDoc) {
    classDoc = await Class.findOne({ classTeacher: teacher._id });
  }

  if (!classDoc) {
    return next(new ApiError(404, "No class assigned to this teacher"));
  }

  const attendance = await Attendance.findOne({
    class: classDoc._id,
    month: Number(month),
    year: Number(year),
  });

  if (!attendance) {
    return next(new ApiError(404, "Attendance register not found"));
  }

  attendance.status = "Draft";
  attendance.completedAt = null;
  attendance.completedBy = null;

  await attendance.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Attendance register reopened for editing", attendance));
});

// ==========================================
// 5. BULK MARK ALL PRESENT FOR A DAY
// ==========================================
export const markAllPresentForDay = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const { month, year, day, status = "Present" } = req.body;

  if (!teacherId || !month || !year || !day) {
    return next(new ApiError(400, "Teacher ID, month, year, and day are required"));
  }

  const teacher = await User.findById(teacherId);
  if (!teacher) {
    return next(new ApiError(404, "Teacher not found"));
  }

  let classDoc = null;
  if (teacher.class) {
    classDoc = await Class.findById(teacher.class);
  }
  if (!classDoc) {
    classDoc = await Class.findOne({ classTeacher: teacher._id });
  }

  if (!classDoc) {
    return next(new ApiError(404, "No class assigned to this teacher"));
  }

  const attendance = await Attendance.findOne({
    class: classDoc._id,
    month: Number(month),
    year: Number(year),
  });

  if (!attendance) {
    return next(new ApiError(404, "Attendance register not found"));
  }

  if (attendance.status === "Completed") {
    return next(new ApiError(400, "Register is locked. Reopen first."));
  }

  const targetDay = Number(day);
  const totalDays = attendance.totalDays;
  const holidayList = attendance.holidays || [];

  attendance.records.forEach((rec) => {
    const dayObj = rec.daily.find((d) => d.day === targetDay);
    if (dayObj) {
      dayObj.status = status;
    }
    rec.summary = computeStudentSummary(
      rec.daily,
      totalDays,
      holidayList,
      Number(year),
      Number(month)
    );
  });

  await attendance.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      `All students marked as ${status} for Day ${targetDay}`,
      attendance
    )
  );
});
