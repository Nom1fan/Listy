package com.listyyy.backend.productbank;

import com.listyyy.backend.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BuiltInProductCatalog {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    private static final List<CategorySpec> CATEGORIES = List.of(
            category("סופרמרקט", "🛒", 100,
                    product("חלב", "🥛", "ליטר"),
                    product("חלב סויה", "🥛", "ליטר"),
                    product("חלב שקדים", "🥛", "ליטר"),
                    product("חלב שיבולת שועל", "🥛", "ליטר"),
                    product("גבינה", "🧀", "יחידה"),
                    product("גבינה טבעונית", "🧀", "יחידה"),
                    product("יוגורט", "🥛", "יחידה"),
                    product("יוגורט טבעוני", "🥛", "יחידה"),
                    product("ביצים", "🥚", "חבילה"),
                    product("חמאה", "🧈", "יחידה"),
                    product("מרגרינה", "🧈", "יחידה"),
                    product("טופו", "🌱", "חבילה"),
                    product("טמפה", "🌱", "חבילה"),
                    product("סייטן", "🌱", "חבילה"),
                    product("חומוס", "🧆", "יחידה"),
                    product("טחינה", "🥣", "יחידה"),
                    product("לחם", "🍞", "כיכר"),
                    product("פיתות", "🫓", "חבילה"),
                    product("לחמניות", "🍞", "חבילה"),
                    product("חלה", "🍞", "כיכר"),
                    product("טורטיות", "🌯", "חבילה"),
                    product("קרקרים", "🥨", "חבילה"),
                    product("אורז", "🍚", "קילו"),
                    product("פסטה", "🍝", "חבילה"),
                    product("קוסקוס", "🍚", "חבילה"),
                    product("קינואה", "🌾", "חבילה"),
                    product("בורגול", "🌾", "חבילה"),
                    product("עדשים", "🫘", "חבילה"),
                    product("שעועית", "🫘", "חבילה"),
                    product("חומוס יבש", "🫘", "חבילה"),
                    product("קמח", "🌾", "קילו"),
                    product("סוכר", "🍚", "קילו"),
                    product("מלח", "🧂", "יחידה"),
                    product("פלפל שחור", "🧂", "יחידה"),
                    product("שמן זית", "🫒", "בקבוק"),
                    product("שמן קנולה", "🛢️", "בקבוק"),
                    product("חומץ", "🍾", "בקבוק"),
                    product("רוטב סויה", "🍶", "בקבוק"),
                    product("קטשופ", "🍅", "בקבוק"),
                    product("מיונז", "🥪", "יחידה"),
                    product("חרדל", "🌭", "יחידה"),
                    product("דגני בוקר", "🥣", "חבילה"),
                    product("גרנולה", "🥣", "חבילה"),
                    product("שיבולת שועל", "🥣", "חבילה"),
                    product("קפה", "☕", "יחידה"),
                    product("תה", "🍵", "יחידה"),
                    product("קקאו", "🍫", "יחידה"),
                    product("שוקולד", "🍫", "יחידה"),
                    product("עוגיות", "🍪", "חבילה"),
                    product("חטיפים", "🍿", "חבילה"),
                    product("אגוזים", "🥜", "חבילה"),
                    product("שקדים", "🌰", "חבילה"),
                    product("פירות יבשים", "🍇", "חבילה"),
                    product("מים", "💧", "בקבוק"),
                    product("סודה", "🫧", "בקבוק"),
                    product("מיץ תפוזים", "🧃", "בקבוק"),
                    product("בירה", "🍺", "בקבוק"),
                    product("יין", "🍷", "בקבוק"),
                    product("עגבניות", "🍅", "קילו"),
                    product("מלפפונים", "🥒", "קילו"),
                    product("חסה", "🥬", "יחידה"),
                    product("גזר", "🥕", "קילו"),
                    product("בצל", "🧅", "קילו"),
                    product("שום", "🧄", "יחידה"),
                    product("תפוחי אדמה", "🥔", "קילו"),
                    product("בטטה", "🍠", "קילו"),
                    product("פלפלים", "🫑", "קילו"),
                    product("ברוקולי", "🥦", "יחידה"),
                    product("פטריות", "🍄", "חבילה"),
                    product("תפוחים", "🍎", "קילו"),
                    product("בננות", "🍌", "קילו"),
                    product("תפוזים", "🍊", "קילו"),
                    product("לימונים", "🍋", "קילו"),
                    product("אבוקדו", "🥑", "יחידה"),
                    product("תותים", "🍓", "חבילה"),
                    product("עוף", "🍗", "קילו"),
                    product("בשר טחון", "🥩", "קילו"),
                    product("דגים", "🐟", "קילו"),
                    product("טונה", "🥫", "יחידה"),
                    product("סלמון", "🐟", "קילו"),
                    product("נייר טואלט", "🧻", "חבילה"),
                    product("מגבות נייר", "🧻", "חבילה"),
                    product("סבון כלים", "🧽", "בקבוק"),
                    product("אבקת כביסה", "🧺", "יחידה"),
                    product("שמפו", "🧴", "בקבוק"),
                    product("סבון גוף", "🧼", "יחידה"),
                    product("משחת שיניים", "🪥", "יחידה"),
                    product("שקיות אשפה", "🗑️", "חבילה"),
                    product("חיתולים", "👶", "חבילה"),
                    product("מגבונים", "🧻", "חבילה")
            ),
            category("ז'אנרים", "🎬", 101,
                    product("אימה", "👻"),
                    product("קומדיה", "😂"),
                    product("פנטזיה", "🐉"),
                    product("מדע בדיוני", "🚀"),
                    product("דרמה", "🎭"),
                    product("אקשן", "💥"),
                    product("הרפתקאות", "🗺️"),
                    product("רומנטיקה", "💘"),
                    product("מתח", "🔪"),
                    product("פשע", "🕵️"),
                    product("תיעודי", "🎥"),
                    product("אנימציה", "🐭"),
                    product("משפחה", "👨‍👩‍👧‍👦"),
                    product("מוזיקלי", "🎵"),
                    product("מערבון", "🤠"),
                    product("ביוגרפיה", "👤"),
                    product("היסטוריה", "🏛️"),
                    product("ספורט", "🏆"),
                    product("ילדים", "🧸"),
                    product("ריאליטי", "📺"),
                    product("מיסטיקה", "🔮"),
                    product("ספרות קלאסית", "📚")
            ),
            category("מסעדות", "🍽️", 102,
                    product("איטלקי", "🍝"),
                    product("סושי", "🍣"),
                    product("המבורגר", "🍔"),
                    product("פיצה", "🍕"),
                    product("אסייתי", "🍜"),
                    product("מקסיקני", "🌮"),
                    product("הודי", "🍛"),
                    product("טבעוני", "🌱"),
                    product("בית קפה", "☕"),
                    product("גלידריה", "🍦"),
                    product("בר", "🍻"),
                    product("מאפייה", "🥐")
            ),
            category("נסיעות", "🧳", 103,
                    product("טיסה", "✈️"),
                    product("מלון", "🏨"),
                    product("דרכון", "🛂"),
                    product("ביטוח נסיעות", "🛡️"),
                    product("מזוודה", "🧳"),
                    product("השכרת רכב", "🚗"),
                    product("רכבת", "🚆"),
                    product("אטרקציות", "🎟️"),
                    product("מפה", "🗺️"),
                    product("מטען", "🔌"),
                    product("אוזניות", "🎧"),
                    product("קרם הגנה", "🧴")
            ),
            category("מתנות", "🎁", 104,
                    product("יום הולדת", "🎂"),
                    product("פרחים", "💐"),
                    product("שוקולד", "🍫"),
                    product("ספר", "📚"),
                    product("צעצוע", "🧸"),
                    product("תכשיט", "💍"),
                    product("בושם", "🧴"),
                    product("גיפט קארד", "🎁"),
                    product("יין", "🍷"),
                    product("עציץ", "🪴"),
                    product("כרטיס ברכה", "💌")
            ),
            category("משימות לבית", "🏠", 105,
                    product("ניקיון", "🧹"),
                    product("כביסה", "🧺"),
                    product("כלים", "🍽️"),
                    product("קניות", "🛒"),
                    product("תיקונים", "🔧"),
                    product("חשבונות", "🧾"),
                    product("גינה", "🪴"),
                    product("סידור ארונות", "🗄️"),
                    product("בישול", "🍳"),
                    product("מיחזור", "♻️"),
                    product("החלפת מצעים", "🛏️"),
                    product("שטיפת רצפה", "🪣")
            ),
            category("בילויים", "🎉", 106,
                    product("קולנוע", "🎬"),
                    product("הופעה", "🎤"),
                    product("הצגה", "🎭"),
                    product("מוזיאון", "🖼️"),
                    product("פארק", "🌳"),
                    product("ים", "🏖️"),
                    product("פיקניק", "🧺"),
                    product("משחקייה", "🛝"),
                    product("באולינג", "🎳"),
                    product("בריכה", "🏊"),
                    product("טיול", "🚶"),
                    product("מסיבה", "🎉")
            )
    );

    @Transactional
    public void seedWorkspace(Workspace workspace) {
        for (CategorySpec spec : CATEGORIES) {
            Category category = categoryRepository.findByWorkspaceId(workspace.getId()).stream()
                    .filter(existing -> existing.getNameHe().equals(spec.nameHe()))
                    .findFirst()
                    .orElseGet(() -> categoryRepository.save(Category.builder()
                            .workspace(workspace)
                            .nameHe(spec.nameHe())
                            .iconId(spec.iconId())
                            .sortOrder(spec.sortOrder())
                            .build()));
            for (ProductSpec productSpec : spec.products()) {
                productRepository.findByCategoryIdAndNameHe(category.getId(), productSpec.nameHe())
                        .orElseGet(() -> productRepository.save(Product.builder()
                                .category(category)
                                .nameHe(productSpec.nameHe())
                                .defaultUnit(productSpec.defaultUnit())
                                .iconId(productSpec.iconId())
                                .build()));
            }
        }
    }

    private static CategorySpec category(String nameHe, String iconId, int sortOrder, ProductSpec... products) {
        return new CategorySpec(nameHe, iconId, sortOrder, List.of(products));
    }

    private static ProductSpec product(String nameHe, String iconId) {
        return product(nameHe, iconId, "יחידה");
    }

    private static ProductSpec product(String nameHe, String iconId, String defaultUnit) {
        return new ProductSpec(nameHe, iconId, defaultUnit);
    }

    private record CategorySpec(String nameHe, String iconId, int sortOrder, List<ProductSpec> products) {
    }

    private record ProductSpec(String nameHe, String iconId, String defaultUnit) {
    }
}
