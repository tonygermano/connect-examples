## Advanced Example
Here we will show multiple ways to solve the same problem using this library.
All methods will start with this inbound ORU message:

```
MSH|^~\&|PS360|SCL|PACS|PVMC|20190418225003||ORU^R 01|12345|P|2.3
PID|||54658945213||Last^First||20190425|M|||^^^^^U SA|||||||20190425|000000001
PV1|1|E|PVED^ED02^ED02^EPVB^R||||1851634828^Last^First^E|1851634828^Last^First^E||1|||||||||370144214|||||||||||||||||||||||||20190418220755
ORC|CN
OBR|1|PV4430266CTPVMC|PV4430266CTPVMC|CT HEAD WO CONTRAST^CT HEAD WO CONTRAST|||20190418223311|||||||||1851634828^Last^First^E||PV4430266CTPVMC|1|1|286701130|20190418224856||CT|F||^^^20190418221731^20190418221355^S|||||0052005^Last^First^A||||20190418221500
ORC|RE
OBR|2|PV4430267CTPVMC|PV4430267CTPVMC|CT CERVICAL SPINE WO CONTRAST^CT CERVICAL SPINE WO CONTRAST|||20190418223311|20190418221731||||||||1851634828^HACKMAN^SCOTT^E||PV4430267CTPVMC|1|1|286701131|20190418224856||CT|F||^^^20190418221731^20190418221340^S|||||0052005^Last^First^A||||20190418222000
OBX|1||||						||||||F|||20230715143617
OBX|2||||RADIOLOGY REPORT||||||F|||20230715143617
OBX|3||||||||||F|||20230715143617
OBX|4||||NAME:  LAST, FIRST      DATE OF EXAM: 06-25-2024 ||||||F|||20230715143617
OBX|5||||||||||F|||20230715143617
OBX|6||||DATE OF BIRTH:  01-01-2025     CHART #: 999999-WW ||||||F|||20230715143617
OBX|7||||||||||F|||20230715143617
OBX|8||||PHYSICIAN:  First Last, MD ||||||F|||20230715143617
OBX|9||||||||||F|||20230715143617
OBX|10||||MRI OF THE BRAIN WITH AND WITHOUT CONTRAST ||||||F|||20230715143617
OBX|11||||||||||F|||20230715143617
OBX|12||||CLINICAL INDICATION:   Headaches, migraines.  ||||||F|||20230715143617
OBX|13||||||||||F|||20230715143617
OBX|14||||||||||F|||20230715143617
OBX|15||||Multiplanar and multiparametric MRI imaging of the brain was performed.||||||F|||20230715143617
OBX|16||||||||||F|||20230715143617
OBX|17||||ADC map and diffusion weighted acquisition reveal no area of restriction to suggest acute infarction.   ||||||F|||20230715143617
OBX|18||||||||||F|||20230715143617
OBX|19||||Sagittal T1 shows no cerebellar tonsillar herniation.  Pontine and midbrain regions are unremarkable.    Optic chiasm and pituitary gland signal were unremarkable.  ||||||F|||20230715143617
OBX|20||||||||||F|||20230715143617
OBX|21||||Axial T1 shows no conspicuous T1 shortening region.   ||||||F|||20230715143617
OBX|22||||||||||F|||20230715143617
OBX|23||||||||||F|||20230715143617
OBX|24||||||||||F|||20230715143617
OBX|25||||Axial T2 shows sellar and suprasellar regions to appear unremarkable.    The 7th and 8th nerves were symmetric bilaterally.   Cerebellar pontine angle presentation was unremarkable.   No evidence of any cerebellar pontine angle mass.   The mastoid air cell signal presentation unremarkable.  Normal flow void of basilar, carotid and middle cerebral distribution was identified.   No conspicuous paraventricular T2 prolongation to suggest demyelinating or dysmyelinating process or small vessel ischemic change identified.   ||||||F|||20230715143617
OBX|26||||||||||F|||20230715143617
OBX|27||||Paranasal sinuses appear patent.   Normal gray white matter signal differentiation.   Globes, optic nerves and orbital muscles and periorbital muscles are symmetric.  Retroorbital fat signal unremarkable.   ||||||F|||20230715143617
OBX|28||||||||||F|||20230715143617
```

And will produce this outbound message consisting of multiple ORU messages:

```
MSH|^~\&|PS360|SCL|PACS|PVMC|20190418225003||ORU^R 01|12345|P|2.3
PID|||54658945213||Last^First||20190425|M|||^^^^^U SA|||||||20190425|000000001
PV1|1|E|PVED^ED02^ED02^EPVB^R||||1851634828^Last^First^E|1851634828^Last^First^E||1|||||||||370144214|||||||||||||||||||||||||20190418220755
ORC|RE
OBR|1|PV4430266CTPVMC|PV4430266CTPVMC|CT HEAD WO CONTRAST^CT HEAD WO CONTRAST|||20190418223311|||||||||1851634828^Last^First^E||PV4430266CTPVMC|1|1|286701130|20190418224856||CT|F||^^^20190418221731^20190418221355^S|||||0052005^Last^First^A||||20190418221500
OBX|1||HEADER|1|RADIOLOGY REPORT||||||F|||20230715143617
OBX|2||HEADER|2|NAME:  LAST, FIRST      DATE OF EXAM: 06-25-2024 ||||||F|||20230715143617
OBX|3||HEADER|3|DATE OF BIRTH:  01-01-2025     CHART #: 999999-WW ||||||F|||20230715143617
OBX|4||HEADER|4|PHYSICIAN:  First Last, MD ||||||F|||20230715143617
OBX|5||HEADER|5|-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-||||||F|||20230715143617
OBX|6||REPORT|1|MRI OF THE BRAIN WITH AND WITHOUT CONTRAST ||||||F|||20230715143617
OBX|7||REPORT|2|||||||F|||20230715143617
OBX|8||REPORT|3|CLINICAL INDICATION:   Headaches, migraines.  ||||||F|||20230715143617
OBX|9||REPORT|4|||||||F|||20230715143617
OBX|10||REPORT|5|Multiplanar and multiparametric MRI imaging of the brain was||||||F|||20230715143617
OBX|11||REPORT|6|performed.||||||F|||20230715143617
OBX|12||REPORT|7|||||||F|||20230715143617
OBX|13||REPORT|8|ADC map and diffusion weighted acquisition reveal no area of||||||F|||20230715143617
OBX|14||REPORT|9|restriction to suggest acute infarction.   ||||||F|||20230715143617
OBX|15||REPORT|10|||||||F|||20230715143617
OBX|16||REPORT|11|Sagittal T1 shows no cerebellar tonsillar herniation. ||||||F|||20230715143617
OBX|17||REPORT|12|Pontine and midbrain regions are unremarkable.    Optic||||||F|||20230715143617
OBX|18||REPORT|13|chiasm and pituitary gland signal were unremarkable.  ||||||F|||20230715143617
OBX|19||REPORT|14|||||||F|||20230715143617
OBX|20||REPORT|15|Axial T1 shows no conspicuous T1 shortening region.   ||||||F|||20230715143617
OBX|21||REPORT|16|||||||F|||20230715143617
OBX|22||REPORT|17|Axial T2 shows sellar and suprasellar regions to appear||||||F|||20230715143617
OBX|23||REPORT|18|unremarkable.    The 7th and 8th nerves were symmetric||||||F|||20230715143617
OBX|24||REPORT|19|bilaterally.   Cerebellar pontine angle presentation was||||||F|||20230715143617
OBX|25||REPORT|20|unremarkable.   No evidence of any cerebellar pontine angle||||||F|||20230715143617
OBX|26||REPORT|21|mass.   The mastoid air cell signal presentation||||||F|||20230715143617
OBX|27||REPORT|22|unremarkable.  Normal flow void of basilar, carotid and||||||F|||20230715143617
OBX|28||REPORT|23|middle cerebral distribution was identified.   No||||||F|||20230715143617
OBX|29||REPORT|24|conspicuous paraventricular T2 prolongation to suggest||||||F|||20230715143617
OBX|30||REPORT|25|demyelinating or dysmyelinating process or small vessel||||||F|||20230715143617
OBX|31||REPORT|26|ischemic change identified.   ||||||F|||20230715143617
OBX|32||REPORT|27|||||||F|||20230715143617
OBX|33||REPORT|28|Paranasal sinuses appear patent.   Normal gray white matter||||||F|||20230715143617
OBX|34||REPORT|29|signal differentiation.   Globes, optic nerves and orbital||||||F|||20230715143617
OBX|35||REPORT|30|muscles and periorbital muscles are symmetric.  Retroorbital||||||F|||20230715143617
OBX|36||REPORT|31|fat signal unremarkable.   ||||||F|||20230715143617
OBX|37||REPORT|32|||||||F|||20230715143617
MSH|^~\&|PS360|SCL|PACS|PVMC|20190418225003||ORU^R 01|12345|P|2.3
PID|||54658945213||Last^First||20190425|M|||^^^^^U SA|||||||20190425|000000001
PV1|1|E|PVED^ED02^ED02^EPVB^R||||1851634828^Last^First^E|1851634828^Last^First^E||1|||||||||370144214|||||||||||||||||||||||||20190418220755
ORC|RE
OBR|2|PV4430267CTPVMC|PV4430267CTPVMC|CT CERVICAL SPINE WO CONTRAST^CT CERVICAL SPINE WO CONTRAST|||20190418223311|20190418221731||||||||1851634828^HACKMAN^SCOTT^E||PV4430267CTPVMC|1|1|286701131|20190418224856||CT|F||^^^20190418221731^20190418221340^S|||||0052005^Last^First^A||||20190418222000
OBX|1||HEADER|1|RADIOLOGY REPORT||||||F|||20230715143617
OBX|2||HEADER|2|NAME:  LAST, FIRST      DATE OF EXAM: 06-25-2024 ||||||F|||20230715143617
OBX|3||HEADER|3|DATE OF BIRTH:  01-01-2025     CHART #: 999999-WW ||||||F|||20230715143617
OBX|4||HEADER|4|PHYSICIAN:  First Last, MD ||||||F|||20230715143617
OBX|5||HEADER|5|-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-||||||F|||20230715143617
OBX|6||REPORT|1|MRI OF THE BRAIN WITH AND WITHOUT CONTRAST ||||||F|||20230715143617
OBX|7||REPORT|2|||||||F|||20230715143617
OBX|8||REPORT|3|CLINICAL INDICATION:   Headaches, migraines.  ||||||F|||20230715143617
OBX|9||REPORT|4|||||||F|||20230715143617
OBX|10||REPORT|5|Multiplanar and multiparametric MRI imaging of the brain was||||||F|||20230715143617
OBX|11||REPORT|6|performed.||||||F|||20230715143617
OBX|12||REPORT|7|||||||F|||20230715143617
OBX|13||REPORT|8|ADC map and diffusion weighted acquisition reveal no area of||||||F|||20230715143617
OBX|14||REPORT|9|restriction to suggest acute infarction.   ||||||F|||20230715143617
OBX|15||REPORT|10|||||||F|||20230715143617
OBX|16||REPORT|11|Sagittal T1 shows no cerebellar tonsillar herniation. ||||||F|||20230715143617
OBX|17||REPORT|12|Pontine and midbrain regions are unremarkable.    Optic||||||F|||20230715143617
OBX|18||REPORT|13|chiasm and pituitary gland signal were unremarkable.  ||||||F|||20230715143617
OBX|19||REPORT|14|||||||F|||20230715143617
OBX|20||REPORT|15|Axial T1 shows no conspicuous T1 shortening region.   ||||||F|||20230715143617
OBX|21||REPORT|16|||||||F|||20230715143617
OBX|22||REPORT|17|Axial T2 shows sellar and suprasellar regions to appear||||||F|||20230715143617
OBX|23||REPORT|18|unremarkable.    The 7th and 8th nerves were symmetric||||||F|||20230715143617
OBX|24||REPORT|19|bilaterally.   Cerebellar pontine angle presentation was||||||F|||20230715143617
OBX|25||REPORT|20|unremarkable.   No evidence of any cerebellar pontine angle||||||F|||20230715143617
OBX|26||REPORT|21|mass.   The mastoid air cell signal presentation||||||F|||20230715143617
OBX|27||REPORT|22|unremarkable.  Normal flow void of basilar, carotid and||||||F|||20230715143617
OBX|28||REPORT|23|middle cerebral distribution was identified.   No||||||F|||20230715143617
OBX|29||REPORT|24|conspicuous paraventricular T2 prolongation to suggest||||||F|||20230715143617
OBX|30||REPORT|25|demyelinating or dysmyelinating process or small vessel||||||F|||20230715143617
OBX|31||REPORT|26|ischemic change identified.   ||||||F|||20230715143617
OBX|32||REPORT|27|||||||F|||20230715143617
OBX|33||REPORT|28|Paranasal sinuses appear patent.   Normal gray white matter||||||F|||20230715143617
OBX|34||REPORT|29|signal differentiation.   Globes, optic nerves and orbital||||||F|||20230715143617
OBX|35||REPORT|30|muscles and periorbital muscles are symmetric.  Retroorbital||||||F|||20230715143617
OBX|36||REPORT|31|fat signal unremarkable.   ||||||F|||20230715143617
OBX|37||REPORT|32|||||||F|||20230715143617
```

Following are the requirements for this transformation:
- The inbound message can have multiple ORC/OBR pairs representing different
   orders.
- The OBX segments collectively represent a report with the values in OBX-5
  each representing a single line of the report. This single report describes
  the results for all orders present in the message.
- The report can be divided into two sections:
  - A header, the end of which is determined by the line beginning with
    "PHYSICIAN:" followed by zero or more non-blank lines of text, followed by
    one or more blank-lines of text.
  - The report body, which is all of the OBX segments following the header.
- In the header section,
  - any blank lines should be removed.
  - a divider consisting of the string `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`
    should be appended to the end.
- In the report section,
  - consecutive blank lines should be condensed to a single blank line.
  - lines longer than 60 characters should be wrapped to multiple lines so that
    they do not exceed 60 characters.
- OBX segments added in either section should retain values common to all of
  the segments in the components following OBX-5.
- OBX-1 should be numbered consecutively for all OBX segments starting at 1.
- OBX-3 should be updated with a value of "HEADER" or "REPORT" indicating to
  which section the OBX segment belongs.
- OBX-4 should be numbered consecutively within each section indicated by OBX-3
  starting each section at 1.
- A copy of the entire message should be made with only a single ORC/OBR pair
  per message for each pair present in the original message.
- ORC-1 should be updated for each copy of the message to have a value of `RE`.
