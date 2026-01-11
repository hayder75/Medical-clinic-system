const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const id = process.argv[2];
    if (!id) { console.log('Usage: node tmp-check-service.js <serviceId>'); process.exit(1); }
    const service = await prisma.service.findUnique({ where: { id }, include: { investigationTypes: true, labTests: true } });
    if (!service) { console.log('Service not found'); process.exit(0); }
    const [billingSvc, nurseAssign, nurseWalkin, emergencyDrug, materialNeeds, batchSvc] = await Promise.all([
      prisma.billingService.findFirst({ where: { serviceId: id } }),
      prisma.nurseServiceAssignment.findFirst({ where: { serviceId: id } }),
      prisma.nurseWalkInOrder.findFirst({ where: { serviceId: id } }),
      prisma.emergencyDrugOrder.findFirst({ where: { serviceId: id } }),
      prisma.materialNeedsOrder.findFirst({ where: { serviceId: id } }),
      prisma.batchOrderService.findFirst({ where: { serviceId: id } })
    ]);
    let hasLabTestOrders = false;
    let hasRadiologyOrders = false;
    let hasLabOrdersViaType = false;
    let hasBatchViaType = false;
    if (service.labTests?.[0]) {
      const labTestId = service.labTests[0].id;
      const c = await prisma.labTestOrder.count({ where: { labTestId } });
      hasLabTestOrders = c > 0;
    }
    if (service.investigationTypes?.[0]) {
      const invTypeId = service.investigationTypes[0].id;
      const [rc, lc, bc] = await Promise.all([
        prisma.radiologyOrder.count({ where: { typeId: invTypeId } }),
        prisma.labOrder.count({ where: { typeId: invTypeId } }),
        prisma.batchOrderService.count({ where: { investigationTypeId: invTypeId } })
      ]);
      hasRadiologyOrders = rc > 0;
      hasLabOrdersViaType = lc > 0;
      hasBatchViaType = bc > 0;
    }
    console.log(JSON.stringify({
      service: { id: service.id, name: service.name, category: service.category },
      billing: !!billingSvc,
      nurseAssign: !!nurseAssign,
      nurseWalkin: !!nurseWalkin,
      emergencyDrug: !!emergencyDrug,
      materialNeeds: !!materialNeeds,
      batchSvc: !!batchSvc,
      hasLabTest: !!(service.labTests && service.labTests.length),
      hasLabTestOrders,
      hasInvestigationType: !!(service.investigationTypes && service.investigationTypes.length),
      hasRadiologyOrders,
      hasLabOrdersViaType,
      hasBatchViaType
    }, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
